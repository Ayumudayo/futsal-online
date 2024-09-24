import prisma from '../utils/prisma.js';

const calculateEnhancedValue = (baseValue, level) => {
  let mult = 1;
  if (level === 0) mult = 1.0;
  else if (level >= 1 && level <= 3) mult = 1.1;
  else if (level >= 4 && level <= 6) mult = 1.3;
  else if (level >= 7 && level <= 8) mult = 1.7;

  return Math.floor(baseValue * mult);
};

const calculatePlayerScore = (playerStats, enhanceLevel) => {
  const weights = {
    speed: 0.15,
    goalScoring: 0.25,
    shotPower: 0.2,
    defense: 0.2,
    stamina: 0.2,
  };

  // 발제 문서에 있는 예시 활용
  let score =
    playerStats.speed * weights.speed +
    playerStats.goalScoring * weights.goalScoring +
    playerStats.shotPower * weights.shotPower +
    playerStats.defense * weights.defense +
    playerStats.stamina * weights.stamina;

  score = calculateEnhancedValue(score, enhanceLevel);

  return score;
};

// 선수 능력치 합산
const calculateTeamScore = (team) => {
  // 팀의 모든 선수에 대해 calculatePlayerScore 함수를 적용하여 점수를 합산
  return team.players.reduce((total, up) => {
    const playerStats = up.player;
    const playerScore = calculatePlayerScore(playerStats, up.level); // 이미 team.players로 돌리고 있어서 up에서 바로 level 가져오기 가능
    return total + playerScore;
  }, 0);
};

export const playMatch = async (req, res, next, opponentTeam = null) => {
  const { userId } = req.user;
  const { teamId, opponentId } = req.body;

  try {
    // 사용자의 팀 검증
    const userTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!userTeam || (userTeam.userId !== userId)) {
      return res.status(404).json({ message: '선택한 팀을 찾을 수 없거나 소유하고 있는 팀이 아닐 수 있습니다.' });
    }

    if (userTeam.players.length !== 3) {
      return res.status(400).json({ message: '선수 3명이 있는 팀을 선택해야 합니다.' });
    }

    // 상대방의 팀 선택
    if (!opponentTeam) {
      // 상대방의 팀이 전달되지 않은 경우, 자동으로 선택
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

      const validOpponentTeams = opponentTeams.filter((team) => team.players.length === 3);

      if (validOpponentTeams.length === 0) {
        return res.status(400).json({ message: '상대방의 유효한 팀이 없습니다.' });
      }

      // 상대방의 팀을 유효한 팀 중에서 랜덤하게 선택
      opponentTeam = validOpponentTeams[Math.floor(Math.random() * validOpponentTeams.length)];
    }

    // 선택된 팀들의 총 점수 계산
    const scoreA = calculateTeamScore(userTeam);
    const scoreB = calculateTeamScore(opponentTeam);

    // 경기 시뮬레이션 로직 (기존과 동일)
    const totalScore = scoreA + scoreB;
    const randomValue = Math.random() * totalScore;

    let matchResult, resultMessage, scoreUser, scoreOpponent;

    // 무승부 확률 설정
    const drawThreshold = 0.05;
    const matchRandom = Math.random();

    if (matchRandom < drawThreshold) {
      // 무승부 처리
      scoreUser = scoreOpponent = Math.floor(Math.random() * 3) + 1;
      matchResult = 'DRAW';
      resultMessage = '무승부';
    } else if (randomValue < scoreA) {
      // 유저 승리
      scoreUser = Math.floor(Math.random() * 4) + 2;
      scoreOpponent = Math.floor(Math.random() * Math.min(3, scoreUser));
      matchResult = 'WIN';
      resultMessage = '승리';
    } else {
      // 유저 패배
      scoreOpponent = Math.floor(Math.random() * 4) + 2;
      scoreUser = Math.floor(Math.random() * Math.min(3, scoreOpponent));
      matchResult = 'LOSE';
      resultMessage = '패배';
    }

    // 데이터베이스 트랜잭션을 통해 경기 기록 및 사용자 통계 업데이트
    await prisma.$transaction(async (prisma) => {
      // 경기 기록 생성
      await prisma.match.create({
        data: {
          playerAId: userId,
          playerBId: parseInt(opponentId),
          scoreA: scoreUser,
          scoreB: scoreOpponent,
          result: matchResult,
        },
      });

      // 경기 결과에 따른 사용자 통계 업데이트
      if (matchResult === 'WIN') {
        // 유저가 승리한 경우
        await prisma.user.update({
          where: { id: userId },
          data: {
            wins: { increment: 1 },
            leaguePoint: { increment: 10 },
          },
        });
        await prisma.user.update({
          where: { id: parseInt(opponentId) },
          data: {
            losses: { increment: 1 },
            leaguePoint: { decrement: 10 },
          },
        });
      } else if (matchResult === 'LOSE') {
        // 유저가 패배한 경우
        await prisma.user.update({
          where: { id: userId },
          data: {
            losses: { increment: 1 },
            leaguePoint: { decrement: 10 },
          },
        });
        await prisma.user.update({
          where: { id: parseInt(opponentId) },
          data: {
            wins: { increment: 1 },
            leaguePoint: { increment: 10 },
          },
        });
      } else if (matchResult === 'DRAW') {
        // 무승부인 경우
        await prisma.user.update({
          where: { id: userId },
          data: {
            draws: { increment: 1 },
            leaguePoint: { increment: 3 },
          },
        });
        await prisma.user.update({
          where: { id: parseInt(opponentId) },
          data: {
            draws: { increment: 1 },
            leaguePoint: { increment: 3 },
          },
        });
      }
    });

    // 경기 결과를 클라이언트에 응답
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
  const { teamId } = req.body; // 사용자의 팀 ID를 요청 본문에서 가져옵니다.

  try {
    // 사용자의 팀 검증 (playMatch와 동일)
    const userTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!userTeam || (userTeam.userId !== userId)) {
      return res.status(404).json({ message: '선택한 팀을 찾을 수 없거나 소유하고 있는 팀이 아닐 수 있습니다.' });
    }

    if (userTeam.players.length !== 3) {
      return res.status(400).json({ message: '선수 3명이 있는 팀을 선택해야 합니다.' });
    }

    // 현재 사용자의 정보 조회
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 리그 포인트(LP) 범위를 설정 (현재 LP +-30)
    const minLP = user.leaguePoint - 30;
    const maxLP = user.leaguePoint + 30;

    // LP 범위 내에 있는 상대방 사용자 검색, 팀 정보 포함
    const opponents = await prisma.user.findMany({
      where: {
        id: { not: userId },
        leaguePoint: {
          gte: minLP,
          lte: maxLP,
        },
      },
      include: {
        teams: {
          include: {
            players: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    // 상대방 중에서 유효한 팀(선수 3명)을 가진 사용자만 필터링
    const validOpponents = opponents.filter((opponent) => {
      const validTeams = opponent.teams.filter((team) => team.players.length === 3);
      return validTeams.length > 0;
    });

    if (validOpponents.length === 0) {
      return res.status(404).json({ message: '상대방을 찾을 수 없습니다.' });
    }

    // 랜덤하게 상대방 선택
    const randomIndex = Math.floor(Math.random() * validOpponents.length);
    const opponent = validOpponents[randomIndex];

    // 상대방의 유효한 팀 중 하나를 선택
    const opponentValidTeams = opponent.teams.filter((team) => team.players.length === 3);
    const opponentTeam = opponentValidTeams[Math.floor(Math.random() * opponentValidTeams.length)];

    // 상대방의 ID를 req.params에 설정하여 playMatch에 전달
    req.params.opponentId = opponent.id;

    // playMatch 함수를 호출하여 매치 진행 (opponentTeam을 인자로 전달)
    // 인자로 주어야 플레이어가 playMatch()를 호출할 때 상대방의 팀을 임의로 선택하는 것을 방지할 수 있음.
    return playMatch(req, res, next, opponentTeam);
  } catch (error) {
    next(error);
  }
};

