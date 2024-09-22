import prisma from '../utils/prisma.js';

const DRAW_COST = 1000; // 기본 가챠 비용

const pullPlayer = async (prisma) => {
  const playerCount = await prisma.player.count();
  const skip = Math.floor(Math.random() * playerCount);
  return prisma.player.findFirst({
    skip: skip,
  });
};

const calculateValue = (drawnPlayer) => {
  return drawnPlayer.speed + drawnPlayer.goalScoring + drawnPlayer.shotPower + drawnPlayer.defense + drawnPlayer.stamina;
};

export const pull = async (req, res, next) => {
  const { userId } = req.user;
  const times = parseInt(req.query.times) || 1; // 기본값은 1회 뽑기

  if (isNaN(times) || times <= 0 || times > 10) {
    return res.status(400).json({ message: '유효하지 않은 뽑기 횟수입니다.' });
  }

  const totalCost = DRAW_COST * times;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user.cash < totalCost) {
        throw new Error('캐시가 부족합니다.');
      }

      let totalValue = 0;
      const drawnUserPlayers = [];

      for (let i = 0; i < times; i++) {
        const drawnPlayer = await pullPlayer(prisma);
        const value = calculateValue(drawnPlayer);
        totalValue += value;

        const userPlayer = await prisma.userPlayer.create({
          data: {
            userId,
            playerId: drawnPlayer.id,
            value,
            level: 0,
          },
          include: { player: true },
        });
        drawnUserPlayers.push(userPlayer);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          cash: { decrement: totalCost },
          totalValue: { increment: totalValue }
        },
      });

      return { drawnUserPlayers, updatedUser };
    });

    res.status(200).json({
      message: times > 1 ? '다중 선수 뽑기에 성공했습니다.' : '선수 뽑기에 성공했습니다.',
      players: result.drawnUserPlayers.map(up => up.player),
      totalValue: result.updatedUser.totalValue,
    });
  } catch (error) {
    if (error.message === '캐시가 부족합니다.') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};