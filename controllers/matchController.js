import prisma from '../utils/prisma.js';

const calculatePlayerScore = (playerStats) => {
  const weights = {
    speed: 0.1,
    goalScoring: 0.25,
    shotPower: 0.15,
    defense: 0.3,
    stamina: 0.2,
  };

  // 발제 문서에 있는 예시 활용
  const score =
    playerStats.speed * weights.speed +
    playerStats.goalScoring * weights.goalScoring +
    playerStats.shotPower * weights.shotPower +
    playerStats.defense * weights.defense +
    playerStats.stamina * weights.stamina;

  return score;
};

// reduce로 선수 능력치 합산
const calculateTeamScore = (team) => {
  return team.players.reduce((total, up) => {
    const playerStats = up.player;
    const playerScore = calculatePlayerScore(playerStats);
    return total + playerScore;
  }, 0);
};

export const playMatch = async (req, res, next) => {
  const opponentId = req.params.opponentId;
  const { userId } = req.user;

  try {
    // 유저 팀과 상대방 팀을 가져옴
    const userTeams = await prisma.team.findMany({
      where: { userId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    // 상대방의 팀 중에서 선수가 3명인 팀들을 가져옴
    const opponentTeams = await prisma.team.findMany({
      where: { userId: parseInt(opponentId) },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    // 플레이를 위한 팀에 선수가 3명 있는지 확인
    const validUserTeams = userTeams.filter((team) => team.players.length === 3);

    if (validUserTeams.length === 0) {
      return res.status(400).json({ message: '자신의 팀이 없거나 선수가 부족합니다.' });
    }   

    // 상대팀 인원수도 확인
    const validOpponentTeams = opponentTeams.filter((team) => team.players.length === 3);

    if (validOpponentTeams.length === 0) {
      return res
        .status(400)
        .json({ message: '상대방의 유효한 팀을 찾을 수 없거나 해당 유저가 존재하지 않습니다.' });
    }

    // 유저의 팀 중에서 랜덤하게 선택
    const userTeam = validUserTeams[Math.floor(Math.random() * validUserTeams.length)];

    // 상대방의 팀 중에서 랜덤하게 선택
    const opponentTeam = validOpponentTeams[Math.floor(Math.random() * validOpponentTeams.length)];

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
      scoreUser = Math.floor(Math.random() * 4) + 2;      // 2에서 5 사이
      scoreOpponent = Math.floor(Math.random() * Math.min(3, scoreUser));
      matchResult = 'WIN';
      resultMessage = '승리';
    } else {
      // 유저 패배
      scoreOpponent = Math.floor(Math.random() * 4) + 2;  // 2에서 5 사이
      scoreUser = Math.floor(Math.random() * Math.min(3, scoreOpponent));
      matchResult = 'LOSE';
      resultMessage = '패배';
    }

    // 기록을 위한 트랜잭션
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
            leaguePoint: { increment: 10 },
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
            leaguePoint: { increment: 3 },
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

    res.status(200).json({
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

    // LP +-30 범위 내의 상대 찾기
    const minLP = user.leaguePoint - 30;
    const maxLP = user.leaguePoint + 30;

    // 상대방 검색
    const opponents = await prisma.user.findMany({
      where: {
        id: { not: userId },
        leaguePoint: {
          gte: minLP,
          lte: maxLP,
        },
      },
    });
    console.log(opponents);

    if (opponents.length === 0) {
      return res.status(404).json({ message: '상대방을 찾을 수 없습니다.' });
    }

    // 랜덤하게 상대 선택
    const randomIndex = Math.floor(Math.random() * opponents.length);
    const opponent = opponents[randomIndex];

    // 경기를 진행하기 위해 opponentId 설정
    req.params.opponentId = opponent.id;
    return playMatch(req, res, next);
    //return res.json('test');
  } catch (error) {
    next(error);
  }
};
