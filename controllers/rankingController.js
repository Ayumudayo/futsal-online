import prisma from '../utils/prisma.js';

export const getRanking = async (req, res, next) => {
  try {
    const { sortType } = req.body;
    let sortTypeField;

    switch (sortType) {
      case 'wins':
        sortTypeField = 'wins';
        break;
      case 'totalValue':
        sortTypeField = 'totalValue';
        break;
      default:
        sortTypeField = 'totalValue';
        break;
    }

    const user = await prisma.user.findMany({
      select: {
        username: true,
        totalValue: true,
        wins: true,
        losses: true,
        draws: true,
      },
      orderBy: {
        [sortTypeField]: 'desc', // 구단점수/승리횟수가 높은 순으로 유저를 정렬한다.
      },
    });

    // totalValue가 bigint라 string로 변경(json에서는 bigint를 지원하지 않는다고 한다.)
    const totalValueToString = user.map((user) => ({
      ...user,
      totalValue: user.totalValue.toString(),
    }));

    return res.status(200).json({ data: totalValueToString });
  } catch (error) {
    next(error);
  }
};
