import prisma from '../utils/prisma.js';

export const buyCash = async (req, res, next) => {
  try {
    // 캐시 추가 구현
    const { cashValue } = req.params;
    const presentcashValue = req.user;

    const account = await prisma.account.findUnique({
      where: { id: parseInt(presentcashValue) },
    });

    if (!account) {
      return res.status(404).json({ error: 'The account is not existed' });
    }

    if (account.user !== presentcashValue) {
      return res.status(403).json({ error: 'Cannot find the right account' });
    }

    const updatedAccount = await prisma.account.updatedAccount({
      where: { id: parseInt(cashValue) },
      data: { cash: account.cash + 500 },
    });
    res.status(200).json({ cash: updatedAccount.cash });
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
