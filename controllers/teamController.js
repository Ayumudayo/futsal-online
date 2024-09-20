import prisma from '../utils/prisma.js';

// 팀 생성
export const createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { userId } = req.user;

    const team = await prisma.team.create({
      data: { name, userId },
    });

    res.status(201).json({ message: '팀 생성에 성공했습니다.', team });
  } catch (error) {
    next(error);
  }
};

// 팀에 선수 추가
export const addPlayer = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userPlayerId } = req.body;
    const { userId } = req.user;

    // 팀 소유권 확인
    const team = await prisma.team.findFirst({
      where: { id: Number(teamId), userId },
    });
    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' });
    }

    // 팀의 선수 수 확인
    const teamPlayersCount = await prisma.userPlayer.count({
      where: { teamId: team.id },
    });
    if (teamPlayersCount >= 3) {
      return res.status(400).json({ message: '팀이 가득 찼습니다.' });
    }

    // 선수 소유권 및 미소속 여부 확인
    const userPlayer = await prisma.userPlayer.findFirst({
      where: { id: userPlayerId, userId, teamId: null },
    });
    if (!userPlayer) {
      return res.status(400).json({ message: '선수를 추가할 수 없습니다.' });
    }

    // 선수 팀에 추가
    await prisma.userPlayer.update({
      where: { id: userPlayerId },
      data: { teamId: team.id },
    });

    res.status(200).json({ message: '선수를 팀에 추가했습니다.' });
  } catch (error) {
    next(error);
  }
};

// 팀에서 특정 선수 제거
export const removePlayer = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userPlayerId } = req.body; // 제거할 선수의 ID
    const { userId } = req.user;

    // 팀 소유권 확인
    const team = await prisma.team.findFirst({
      where: { id: Number(teamId), userId },
    });
    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' });
    }

    // 선수 확인 및 팀 소속 여부 확인
    const userPlayer = await prisma.userPlayer.findFirst({
      where: {
        id: Number(userPlayerId),
        userId,
        teamId: team.id,
      },
    });
    if (!userPlayer) {
      return res.status(404).json({ message: '선수를 찾을 수 없거나 팀에 속해 있지 않습니다.' });
    }

    // 선수의 팀 소속 해제
    await prisma.userPlayer.update({
      where: { id: userPlayer.id },
      data: { teamId: null },
    });

    res.status(200).json({ message: '선수를 팀에서 제거했습니다.' });
  } catch (error) {
    next(error);
  }
};

// 팀을 구성하는 선수 수정
export const editTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { addPlayers, removePlayers } = req.body; // 추가/제거할 선수 ID들
    const { userId } = req.user;

    const teamIdNum = parseInt(teamId);

    // 입력을 배열로 변환하고 숫자로 매핑
    // 잘못된 입력을 filter(Boolean)을 통해 필터링
    const toSet = (input) => new Set([].concat(input).filter(Boolean).map(Number));

    // addPlayers와 removePlayers를 숫자 Set으로 변환
    const addSet = toSet(addPlayers);
    const removeSet = toSet(removePlayers);

    // 교집합을 찾아 양쪽에서 제거
    [...addSet].forEach((id) => {
      if (removeSet.has(id)) {
        addSet.delete(id);
        removeSet.delete(id);
      }
    });

    // 최종 배열로 변환
    const addPlayerIds = [...addSet];
    const removePlayerIds = [...removeSet];

    // 팀 소유권 확인
    const team = await prisma.team.findFirst({
      where: { id: teamIdNum, userId },
      include: { players: true },
    });
    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' });
    }

    // 현재 팀의 선수 수
    let currentPlayerCount = team.players.length;

    // 선수 제거를 먼저 처리
    await prisma.$transaction(async (prisma) => {
      if (removePlayerIds.length > 0) {
        for (const playerId of removePlayerIds) {
          const userPlayer = await prisma.userPlayer.findFirst({
            where: {
              id: playerId,
              userId,
              teamId: teamIdNum,
            },
          });
          if (!userPlayer) {
            throw new Error(`ID가 ${playerId}인 선수를 제거할 수 없습니다.`);
          }
          await prisma.userPlayer.update({
            where: { id: userPlayer.id },
            data: { teamId: null },
          });
          currentPlayerCount -= 1;
        }
      }

      // 선수 추가 처리
      if (addPlayerIds.length > 0) {
        const availableSlots = 3 - currentPlayerCount;
        if (addPlayerIds.length > availableSlots) {
          throw new Error(`팀에 추가할 수 있는 선수는 최대 ${availableSlots}명입니다.`);
        }

        for (const playerId of addPlayerIds) {
          const userPlayer = await prisma.userPlayer.findFirst({
            where: {
              id: playerId,
              userId,
              teamId: null, // 팀에 소속되지 않은 선수
            },
          });
          if (!userPlayer) {
            throw new Error(`ID가 ${playerId}인 선수를 추가할 수 없습니다.`);
          }
          await prisma.userPlayer.update({
            where: { id: userPlayer.id },
            data: { teamId: teamIdNum },
          });
          currentPlayerCount += 1;
        }
      }
    });

    res.json({ message: '팀이 성공적으로 수정되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 유저의 특정 팀을 가져옴
export const getTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.user;

    // 팀 소유권 확인
    const team = await prisma.team.findFirst({
      where: { id: Number(teamId), userId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });
    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' });
    }

    res.json({ team });
  } catch (error) {
    next(error);
  }
};

// 유저의 모든 팀을 가져옴
export const getAllTeams = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const teams = await prisma.team.findMany({
      where: { userId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    res.status(200).json({ teams });
  } catch (error) {
    next(error);
  }
};
