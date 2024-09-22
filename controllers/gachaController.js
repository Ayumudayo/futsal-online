import prisma from '../utils/prisma.js';

const calculateBaseValue = (player) => (
  player.speed +
  player.goalScoring +
  player.shotPower +
  player.defense +
  player.stamina
);

export const drawPlayers = async (req, res, next) => {
  const DRAW_COST = 1000; // 기본 가챠 비용
  const { userId } = req.user;
  const { drawCount } = req.body; // 클라이언트로부터 뽑기 횟수를 받음

  // 뽑기 횟수 기본값 설정 및 유효성 검사
  const numberOfDraws = parseInt(drawCount) || 1;
  const MAX_DRAWS = 10; // 최대 뽑기 횟수 제한
  if (numberOfDraws < 1 || numberOfDraws > MAX_DRAWS) {
    return res.status(400).json({ message: `뽑기 횟수는 1부터 ${MAX_DRAWS} 사이여야 합니다.` });
  }

  const totalCost = DRAW_COST * numberOfDraws;

  try {
    // 트랜잭션 시작
    const result = await prisma.$transaction(async (prisma) => {
      // 사용자 정보 확인
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      if (user.cash < totalCost) {
        throw new Error('캐시가 부족합니다.');
      }

      // 전체 레코드 수를 가져옴
      const totalPlayers = await prisma.player.count();
      if (totalPlayers === 0) {
        throw new Error('선수 데이터가 없습니다.');
      }

      // 병렬로 랜덤 선수 선택
      const playerPromises = Array(numberOfDraws).fill().map(() => {
        const randomIndex = Math.floor(Math.random() * totalPlayers);
        return prisma.player.findFirst({ skip: randomIndex });
      });
      const players = await Promise.all(playerPromises);

      let totalBaseValue = 0;

      // 병렬로 userPlayer 생성
      const userPlayerPromises = players.map(player => {
        const baseValue = calculateBaseValue(player);
        totalBaseValue += baseValue;
        return prisma.userPlayer.create({
          data: {
            userId,
            playerId: player.id,
            value: baseValue,
            level: 0,
          },
          include: { player: true },
        });
      });
      const userPlayers = await Promise.all(userPlayerPromises);

      // 사용자 정보 한 번에 업데이트 (캐시 차감 및 총 가치 증가)
      await prisma.user.update({
        where: { id: userId },
        data: { 
          cash: { decrement: totalCost },
          totalValue: { increment: totalBaseValue }
        },
      });

      return { drawnPlayers: userPlayers.map(up => up.player) };
    });

    res.status(200).json({
      message: `${numberOfDraws}명의 선수를 성공적으로 뽑았습니다.`,
      players: result.drawnPlayers,
    });
  } catch (error) {
    if (error.message === '사용자를 찾을 수 없습니다.' || error.message === '캐시가 부족합니다.' || error.message === '선수 데이터가 없습니다.') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};