import prisma from '../utils/prisma.js';

const DRAW_COST = 1000; // 기본 가챠 비용

const pullPlayer = async () => {
  const allPlayers = await prisma.player.findMany();
  return allPlayers[Math.floor(Math.random() * allPlayers.length)];
};

const calculateValue = (drawnPlayer) => {
  return drawnPlayer.speed + drawnPlayer.goalScoring + drawnPlayer.shotPower + drawnPlayer.defense + drawnPlayer.stamina;
};

export const pull = async (req, res, next) => {
  const { userId } = req.user;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.cash < DRAW_COST) {
      return res.status(400).json({ message: '캐시가 부족합니다.' });
    }

    const result = await prisma.$transaction(async (prisma) => {
      const drawnPlayer = await pullPlayer();
      const value = calculateValue(drawnPlayer);

      const [updatedUser, drawnUserPlayer] = await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: { 
            cash: { decrement: DRAW_COST },
            totalValue: { increment: value }
          },
        }),
        prisma.userPlayer.create({
          data: {
            userId,
            value,
            level: 0,
          },
          include: { player: true },
        })
      ]);

      return { drawnUserPlayer, updatedUser };
    });

    res.status(200).json({
      message: '선수 뽑기에 성공했습니다.',
      player: result.drawnUserPlayer.player,
      totalValue: result.updatedUser.totalValue,
    });
  } catch (error) {
    next(error);
  }
};

export const multiPull = async (req, res, next) => {
  const { userId } = req.user;
  const times = parseInt(req.params.times);

  if (isNaN(times) || times <= 0 || times > 10) {
    return res.status(400).json({ message: '유효하지 않은 뽑기 횟수입니다.' });
  }

  const totalCost = DRAW_COST * times;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.cash < totalCost) {
      return res.status(400).json({ message: '캐시가 부족합니다.' });
    }

    const result = await prisma.$transaction(async (prisma) => {
      const drawnPlayers = await Promise.all(Array(times).fill().map(() => pullPlayer()));
      let totalValue = 0;

      const drawnUserPlayers = await Promise.all(drawnPlayers.map(async (drawnPlayer) => {
        const value = calculateValue(drawnPlayer);
        totalValue += value;
        return prisma.userPlayer.create({
          data: {
            userId,
            value,
            level: 0,
          },
          include: { player: true },
        });
      }));

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
      message: '다중 선수 뽑기에 성공했습니다.',
      players: result.drawnUserPlayers.map(up => up.player),
      totalValue: result.updatedUser.totalValue,
    });
  } catch (error) {
    next(error);
  }
};