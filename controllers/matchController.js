import prisma from '../utils/prisma.js';

const calculateTeamScore = (team) => {
  return team.players.reduce((total, up) => {
    return total + up.value;
  }, 0);
};

export const playMatch = async (req, res, next) => {
  const opponentId = Number(req.params.opponentId);
  const { userId } = req.user;

  try {
    // 팀 가져오기
    const userTeam = await prisma.team.findFirst({
      where: { userId },
      include: { players: { include: { player: true } } },
    });
    const opponentTeam = await prisma.team.findFirst({
      where: { userId: opponentId },
      include: { players: { include: { player: true } } },
    });

    if (!userTeam || !opponentTeam) {
      return res.status(400).json({ message: '팀을 찾을 수 없습니다.' });
    }

    if (userTeam.players.length !== 3 || opponentTeam.players.length !== 3) {
      return res.status(400).json({ message: '양 팀 모두 3명의 선수가 있어야 합니다.' });
    }

    // 팀 점수 계산
    const scoreA = calculateTeamScore(userTeam);
    const scoreB = calculateTeamScore(opponentTeam);

    // 경기 시뮬레이션
    const totalScore = scoreA + scoreB;
    const randomValue = Math.random() * totalScore;

    let matchResult, resultMessage, scoreUser, scoreOpponent;

    // 무승부 확률을 위해 임의의 값 생성
    const drawThreshold = 0.05; // 5% 확률로 무승부 발생
    const matchRandom = Math.random();

    if (matchRandom < drawThreshold) {
      // 무승부 처리
      scoreUser = scoreOpponent = Math.floor(Math.random() * 3) + 1;
      matchResult = 'DRAW';
      resultMessage = '무승부';
    } else if (randomValue < scoreA) {
      // 유저 승리
      scoreUser = Math.floor(Math.random() * 2) + 2;
      scoreOpponent = Math.floor(Math.random() * Math.min(3, scoreUser));
      matchResult = 'WIN';
      resultMessage = '승리';
    } else {
      // 유저 패배
      scoreOpponent = Math.floor(Math.random() * 2) + 2;
      scoreUser = Math.floor(Math.random() * Math.min(3, scoreOpponent));
      matchResult = 'LOSE';
      resultMessage = '패배';
    }

    // 트랜잭션 시작
    await prisma.$transaction(async (prisma) => {
      // 경기 기록 생성
      await prisma.match.create({
        data: {
          playerAId: userId,
          playerBId: opponentId,
          scoreA: scoreUser,
          scoreB: scoreOpponent,
          result: matchResult,
        },
      });

      // 유저 통계 업데이트
      if (matchResult === 'WIN') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            wins: { increment: 1 },
            leaguePoint: { increment: 10 }, // 이기면 10, 지면 -10
          },
        });
        await prisma.user.update({
          where: { id: opponentId },
          data: {
            losses: { increment: 1 },
            leaguePoint: { decrement: 10 },
          },
        });
      } else if (matchResult === 'LOSE') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            losses: { increment: 1 },
            leaguePoint: { decrement: 10 },
          },
        });
        await prisma.user.update({
          where: { id: opponentId },
          data: {
            wins: { increment: 1 },
            leaguePoint: { increment: 10 },
          },
        });
      } else if (matchResult === 'DRAW') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            draws: { increment: 1 },
            leaguePoint: { increment: 3 }, // 그냥 3씩 주는걸로
          },
        });
        await prisma.user.update({
          where: { id: opponentId },
          data: {
            draws: { increment: 1 },
            leaguePoint: { increment: 5 },
          },
        });
      }
    });

    res.json({
      message: `경기가 완료되었습니다. 결과: ${resultMessage}`,
      score: `${scoreUser} - ${scoreOpponent}`,
    });
  } catch (error) {
    next(error);
  }
};

export const autoMatch = async (req, res, next) => {
  const { userId } = req.user;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // LP가 +-30 범위 내의 상대 찾기
    const minLP = user.leaguePoint - 30;
    const maxLP = user.leaguePoint + 30;

    const opponents = await prisma.user.findMany({
      where: {
        id: { not: userId },
        leaguePoint: {
          gte: minLP,
          lte: maxLP,
        },
      },
    });

    if (opponents.length === 0) {
      return res.status(404).json({ message: '상대방을 찾을 수 없습니다.' });
    }

    // 랜덤하게 상대 선택
    const randomIndex = Math.floor(Math.random() * opponents.length);
    const opponent = opponents[randomIndex];

    // 경기를 진행하기 위해 opponentId 설정
    req.params.opponentId = opponent.id;
    return playMatch(req, res, next);
  } catch (error) {
    next(error);
  }
};
