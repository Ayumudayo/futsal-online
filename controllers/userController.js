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
        totalPlayerValue: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
