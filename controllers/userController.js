import prisma from '../utils/prisma.js';

export const rankSort = async (req, res, next) => {
    const {sortType} = req.body;
    let sortTypeField

    switch(sortType) {
        case 'win':
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
            [sortTypeField]: 'desc'     // 구단점수/승리횟수가 높은 순으로 유저를 정렬한다.
        }
    });

    const totalValueToString = user.map(user => ({
        ...user,
        totalValue: user.totalValue.toString()
    }));

    return res.status(200).json({data: totalValueToString});
};