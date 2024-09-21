import prisma from '../utils/prisma.js';

// 레벨별 성공 확률 정의
const successRates = {
  0: 0.95,  // 레벨 0 -> 1: 95% 성공률
  1: 0.9,   // 레벨 1 -> 2: 90%
  2: 0.8,
  3: 0.7,
  4: 0.6,
  5: 0.5,
  6: 0.4,
  7: 0.3,
  8: 0.2,   // 최대가 8이기 때문에 일단은 사용되지 않음
};

// 강화 구간에 따라 가치 상승 비율 구분
const calculateEnhancedValue = (baseValue, level) => {
  let mult = 1;
  if (level === 0) mult = 1.0;
  else if (level >= 1 && level <= 3) mult = 1.1;
  else if (level >= 4 && level <= 6) mult = 1.3;
  else if (level >= 7 && level <= 8) mult = 1.7;

  return Math.floor(baseValue * mult);
};

// 비율 기반 강화 비용 계산
const calculateEnhancementCost = (baseCost, level) => {
  const rate = 1.3; // 강화 비용 증가 비율
  return Math.floor(baseCost * Math.pow(rate, level));
};

// 선수 강화
export const enhancePlayer = async (req, res, next) => {
  const { userId } = req.user;
  const { userPlayerId } = req.params;

  try {
    // 현재 유저의 캐시 정보 가져오기
    const currentUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { cash: true },
    });

    // 유저의 선수 가져오기
    const userPlayer = await prisma.userPlayer.findFirst({
      where: { id: parseInt(userPlayerId), userId },
      include: { player: true },
    });

    if (!userPlayer) {
      return res.status(404).json({ message: '선수를 찾을 수 없습니다.' });
    }

    if (userPlayer.level >= 8) {
      return res.status(400).json({ message: '최대 레벨에 도달했습니다.' });
    }

    const currentLevel = userPlayer.level;
    const baseCost = 1000; // 기본 강화 비용
    const cost = calculateEnhancementCost(baseCost, currentLevel); // 현재 레벨에 따른 강화 비용 계산

    // 충분한 캐시가 있는지 확인
    if (currentUser.cash < cost) {
      return res.status(400).json({ message: '강화에 필요한 캐시가 부족합니다.' });
    }

    const successRate = successRates[currentLevel]; // 성공률 가져오기
    const isSuccess = Math.random() < successRate;  // 랜덤으로 0 ~ 1 사이의 수를 뽑아 비교하여 성공여부 판단

    let newLevel = currentLevel;
    let message = '';
    
    if (isSuccess) {  // 성공
      newLevel += 1;
      message = `강화에 성공했습니다! 새로운 레벨: ${newLevel}`;

      // 기존 및 새로운 가치 계산
      const baseValue = userPlayer.value;
      const oldValue = userPlayer.value;
      const newValue = calculateEnhancedValue(baseValue, newLevel);

      // 선수 레벨, 가치 업데이트, 캐시 차감 처리 트랜잭션
      await prisma.$transaction(async (prisma) => {
        // UserPlayer 업데이트
        await prisma.userPlayer.update({
          where: { id: userPlayer.id },
          data: {
            level: newLevel,
            value: newValue,
          },
        });

        // 유저의 총 선수 가치 업데이트
        const valueDiff = newValue - oldValue;

        // 가치 및 캐시 업데이트
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalValue: { increment: valueDiff },   // 구단가치 업데이트
            cash: { decrement: cost },              // 강화 비용 차감
          },
        });
      });
    } else {  // 실패
      message = '강화에 실패했습니다.';

      // 강화 실패 시에도 캐시 차감
      await prisma.user.update({
        where: { id: userId },
        data: {
          cash: { decrement: cost }, // 강화 실패 비용 차감
        },
      });
    }

    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};
