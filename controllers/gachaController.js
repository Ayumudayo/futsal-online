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
    // 먼저 사용자를 가져옴
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 캐시가 총 비용 이상 있는지 확인
    if (user.cash < totalCost) {
      return res.status(400).json({ message: '캐시가 부족합니다.' });
    }

    // 트랜잭션 시작
    const result = await prisma.$transaction(async (prisma) => {
      // 캐시 차감
      await prisma.user.update({
        where: { id: userId },
        data: { cash: { decrement: totalCost } },
      });

      // 전체 레코드 수를 가져옴
      const totalPlayers = await prisma.player.count();
      if (totalPlayers === 0) {
        throw new Error('선수 데이터가 없습니다.');
      }

      const drawnPlayers = [];
      let totalBaseValue = 0;

      for (let i = 0; i < numberOfDraws; i++) {
        const randomIndex = Math.floor(Math.random() * totalPlayers);
        const player = await prisma.player.findFirst({
          skip: randomIndex,
        });

        if (!player) {
          throw new Error('랜덤 선수를 찾을 수 없습니다.');
        }

        const baseValue = calculateBaseValue(player);
        totalBaseValue += baseValue;

        const userPlayer = await prisma.userPlayer.create({
          data: {
            userId,
            playerId: player.id,
            value: baseValue,
            level: 0, // 레벨 0 명시
          },
          include: { player: true },
        });

        drawnPlayers.push(userPlayer.player);
      }

      // 유저의 총 선수 가치 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: { totalValue: { increment: totalBaseValue } },
      });

      return { drawnPlayers };
    });

    res.status(200).json({
      message: `${numberOfDraws}명의 선수를 성공적으로 뽑았습니다.`,
      players: result.drawnPlayers,
    });
  } catch (error) {
    next(error);
  }
};
