import prisma from '../utils/prisma.js';

// 레벨별 성공 확률 정의
const successRates = {
  0: 0.95, // 레벨 0 -> 1: 95% 성공률
  1: 0.9, // 레벨 1 -> 2: 90% 성공률
  2: 0.8,
  3: 0.7,
  4: 0.6,
  5: 0.5,
  6: 0.4,
  7: 0.3,
  8: 0.2, // 레벨 8 -> 9: 20% 성공률 (현재 최대 레벨이 8이므로 사용되지 않음)
};

const calculateEnhancedValue = (baseValue, level) => {
  let mult = 1; // 초기 배율 설정

  // 선수의 현재 레벨에 따라 배율 설정
  if (level === 0) mult = 1.0;
  else if (level >= 1 && level <= 3) mult = 1.1;
  else if (level >= 4 && level <= 6) mult = 1.3;
  else if (level >= 7 && level <= 8) mult = 1.7;

  // 배율을 적용하여 강화된 가치 계산 후 정수로 반환
  return Math.floor(baseValue * mult);
};

const calculateEnhancementCost = (baseCost, level) => {
  const rate = 1.3; // 강화 비용 증가 비율
  return Math.floor(baseCost * Math.pow(rate, level)); // 비용 계산 후 정수로 반환
};

export const enhancePlayer = async (req, res, next) => {
  const { userId } = req.user; // 요청한 사용자의 ID 추출
  const { userPlayerId } = req.params; // 요청 경로에서 선수 ID 추출

  try {
    // 현재 유저의 캐시 정보 가져오기
    const currentUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { cash: true }, // 캐시만 선택적으로 조회
    });

    // 유저의 특정 선수를 가져오기
    const userPlayer = await prisma.userPlayer.findFirst({
      where: { id: parseInt(userPlayerId), userId }, // 선수 ID와 사용자 ID로 조회
      include: { player: true }, // 선수의 상세 정보 포함
    });

    if (!userPlayer) {
      // 선수가 존재하지 않는 경우 404 에러 반환
      return res.status(404).json({ message: '선수를 찾을 수 없습니다.' });
    }

    if (userPlayer.level >= 8) {
      // 최대 레벨에 도달한 선수는 더 이상 강화할 수 없음
      return res.status(400).json({ message: '최대 레벨에 도달했습니다.' });
    }

    const currentLevel = userPlayer.level; // 선수의 현재 레벨
    const baseCost = 1000; // 기본 강화 비용 설정
    const cost = calculateEnhancementCost(baseCost, currentLevel); // 현재 레벨에 따른 강화 비용 계산

    // 사용자의 캐시가 충분한지 확인
    if (currentUser.cash < cost) {
      return res.status(400).json({ message: '강화에 필요한 캐시가 부족합니다.' });
    }

    const successRate = successRates[currentLevel]; // 현재 레벨에 따른 성공률 조회
    const isSuccess = Math.random() < successRate; // 랜덤 값을 통해 강화 성공 여부 결정

    let newLevel = currentLevel; // 강화 후 새로운 레벨 (초기값은 현재 레벨)
    let message = ''; // 클라이언트에 보낼 메시지 초기화

    if (isSuccess) {
      // 강화 성공 시
      newLevel += 1; // 레벨 상승
      message = `강화에 성공했습니다! 새로운 레벨: ${newLevel}`; // 성공 메시지 설정

      // 기존 가치와 새로운 가치 계산
      const baseValue = userPlayer.value; // 기존 선수의 가치
      const oldValue = userPlayer.value; // 기존 가치 저장
      const newValue = calculateEnhancedValue(baseValue, newLevel); // 강화된 가치 계산

      // 선수 레벨, 가치 업데이트 및 캐시 차감을 트랜잭션으로 처리
      await prisma.$transaction(async (prisma) => {
        // UserPlayer 테이블 업데이트: 레벨과 가치 변경
        await prisma.userPlayer.update({
          where: { id: userPlayer.id },
          data: {
            level: newLevel, // 새로운 레벨 설정
            value: newValue, // 새로운 가치 설정
          },
        });

        // 사용자의 총 선수 가치를 업데이트
        const valueDiff = newValue - oldValue; // 가치 차이 계산

        // User 테이블 업데이트: 총 가치 증가 및 캐시 차감
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalValue: { increment: valueDiff }, // 구단 가치 증가
            cash: { decrement: cost }, // 강화 비용 차감
          },
        });
      });
    } else {
      // 강화 실패 시
      message = '강화에 실패했습니다.'; // 실패 메시지 설정

      // 강화 실패 시에도 캐시 차감
      await prisma.user.update({
        where: { id: userId },
        data: {
          cash: { decrement: cost }, // 강화 비용 차감
        },
      });
    }

    // 강화 결과를 클라이언트에 응답
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};
