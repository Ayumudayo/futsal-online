import prisma from '../utils/prisma.js';

export const buyCash = async (req, res, next) => {
  try {
    // 캐시 추가 구현
    const { cashValue } = req.body;
    const { userId } = req.user.userId;

    const user = await prisma.account.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'The account is not existed' });
    }

    if (user !== userId) {
      return res.status(403).json({ error: 'Cannot find the right account' });
    }

    const cash = await prisma.account.cash({
      where: { id: parseInt(userId) },
      data: { cash: cash },
    });
    res.status(200).json({ cash: cash });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    // 프로필 가져오기 구현
  } catch (error) {
    next(error);
  }
};
