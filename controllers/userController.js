import prisma from '../utils/prisma.js';

export const buyCash = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const { userId } = req.user;

    if (amount <= 0) {
      return res.status(400).json({ message: '금액은 양수여야 합니다.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { cash: { increment: amount } },
    });

    res.json({ message: `${amount} 캐시를 구매했습니다.`, cash: user.cash });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        cash: true,
        leaguePoint: true,
        wins: true,
        losses: true,
        draws: true,
        totalValue: true,
      },
    });

    const userProfile = {
      ...user,
      totalValue: user.totalValue.toString(),
    };

    return res.status(200).json({ data: userProfile });
  } catch (error) {
    next(error);
  }
};

// 유저의 모든 선수를 가져옴
export const getAllPlayer = async (req, res, next) => {
  try {
    const {userId} = req.user;
    
    const playerData = await prisma.userPlayer.findMany({
      where: {userId},
      select: {
        id: true,
        level: true,
        teamId: true,
        player: {
          select: {
            name: true,
            speed: true,
            goalScoring: true,
            shotPower: true,
            defense: true,
            stamina: true
          }
        },
      }
    });

    res.status(200).json({playerData});
  } catch (error) {
    next(error);
  }
};