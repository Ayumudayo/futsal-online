import prisma from '../utils/prisma.js';

export const rankSort = async (req, res, next) => {
    const {sortType} = req.body;
    let sortTypeField = 'leaguePoint';

    if(sortType === 'win')
        sortTypeField = 'wins';
    else if(sortType === 'leaguePoint')
        sortTypeField = 'leaguePoint';

    const user = await prisma.user.findMany({
        select: {
            username: true,
            leaguePoint: true,
            wins: true,
            losses: true,
            draws: true,
        },
        orderBy: {
            [sortTypeField]: 'desc'     // 구단점수/승리횟수가 높은 순으로 유저를 정렬한다.
        }
    });

    return res.status(200).json({data: user});
};