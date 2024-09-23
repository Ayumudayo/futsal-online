import prisma from '../utils/prisma.js';

const calculateBaseValue = (player) =>
  player.speed + player.goalScoring + player.shotPower + player.defense + player.stamina;

export const drawPlayers = async (req, res, next) => {
  const DRAW_COST = 1000;
  const { userId } = req.user;
  const { drawCount } = req.body; // 클라이언트로부터 받은 뽑기 횟수

  // 뽑기 횟수 기본값 설정 및 유효성 검사
  const numberOfDraws = parseInt(drawCount) || 1; // 뽑기 횟수를 정수로 변환, 기본값은 1
  const MAX_DRAWS = 10; // 허용되는 최대 뽑기 횟수
  if (numberOfDraws < 1 || numberOfDraws > MAX_DRAWS) {
    // 뽑기 횟수가 1 미만 또는 MAX_DRAWS 초과인 경우 에러 반환
    return res.status(400).json({ message: `뽑기 횟수는 1부터 ${MAX_DRAWS} 사이여야 합니다.` });
  }

  const totalCost = DRAW_COST * numberOfDraws; // 총 비용 계산

  try {
    // 사용자 정보를 데이터베이스에서 조회
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      // 사용자가 존재하지 않는 경우 에러 반환
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자의 캐시가 충분한지 확인
    if (user.cash < totalCost) {
      return res.status(400).json({ message: '캐시가 부족합니다.' });
    }

    // 트랜잭션 시작: 여러 데이터베이스 작업을 원자적으로 처리
    const result = await prisma.$transaction(async (prisma) => {
      // 사용자의 캐시에서 총 비용만큼 차감
      await prisma.user.update({
        where: { id: userId },
        data: { cash: { decrement: totalCost } },
      });

      // 전체 선수 수를 조회하여 랜덤 선택에 사용
      const totalPlayers = await prisma.player.count();
      if (totalPlayers === 0) {
        // 선수 데이터가 없는 경우 에러 발생
        throw new Error('선수 데이터가 없습니다.');
      }

      const drawnPlayers = []; // 뽑힌 선수들을 저장할 배열
      let totalBaseValue = 0; // 뽑힌 선수들의 총 기본 가치

      // 지정된 횟수만큼 선수 뽑기 수행
      for (let i = 0; i < numberOfDraws; i++) {
        const randomIndex = Math.floor(Math.random() * totalPlayers); // 랜덤 인덱스 생성
        const player = await prisma.player.findFirst({
          skip: randomIndex, // 랜덤 인덱스 만큼 건너뛰고 첫 번째 선수 조회
        });

        if (!player) {
          // 랜덤 인덱스에 해당하는 선수가 없는 경우 에러 발생
          throw new Error('랜덤 선수를 찾을 수 없습니다.');
        }

        const baseValue = calculateBaseValue(player); // 선수의 기본 가치 계산
        totalBaseValue += baseValue; // 총 기본 가치에 추가

        // 사용자와 선수 간의 관계 생성 (userPlayer 레코드 생성)
        const userPlayer = await prisma.userPlayer.create({
          data: {
            userId,
            playerId: player.id,
            value: baseValue,
            level: 0, // 선수의 초기 레벨 설정
          },
          include: { player: true }, // 생성된 userPlayer와 관련된 선수 정보 포함
        });

        drawnPlayers.push(userPlayer.player); // 뽑힌 선수 정보를 배열에 추가
      }

      // 사용자의 총 선수 가치 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: { totalValue: { increment: totalBaseValue } },
      });

      return { drawnPlayers }; // 트랜잭션 결과 반환
    });

    // 성공적으로 선수 뽑기가 완료된 경우 클라이언트에 응답
    res.status(200).json({
      message: `${numberOfDraws}명의 선수를 성공적으로 뽑았습니다.`,
      players: result.drawnPlayers, // 뽑힌 선수들의 정보 포함
    });
  } catch (error) {
    next(error);
  }
};
