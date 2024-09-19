import prisma from '../utils/prisma.js';

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

    res.json({ message: '선수를 팀에 추가했습니다.' });
  } catch (error) {
    next(error);
  }
};

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

    res.json({ message: '선수를 팀에서 제거했습니다.' });
  } catch (error) {
    next(error);
  }
};

export const editTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { addPlayers, removePlayers } = req.body; // 추가할 선수 IDs, 제거할 선수 IDs
    const { userId } = req.user;

    // 팀 소유권 확인
    const team = await prisma.team.findFirst({
      where: { id: Number(teamId), userId },
      include: { players: true },
    });
    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' });
    }

    // 현재 팀의 선수 수 확인
    const currentPlayerCount = team.players.length;

    // 추가할 선수 처리
    if (addPlayers && addPlayers.length > 0) {
      const availableSlots = 3 - currentPlayerCount;
      if (addPlayers.length > availableSlots) {
        return res
          .status(400)
          .json({ message: `팀에 추가할 수 있는 선수는 최대 ${availableSlots}명입니다.` });
      }

      for (const playerId of addPlayers) {
        // 선수 소유권 및 미소속 여부 확인
        const userPlayer = await prisma.userPlayer.findFirst({
          where: {
            id: Number(playerId),
            userId,
            teamId: null,
          },
        });
        if (!userPlayer) {
          return res.status(400).json({ message: `ID가 ${playerId}인 선수를 추가할 수 없습니다.` });
        }

        // 선수 팀에 추가
        await prisma.userPlayer.update({
          where: { id: userPlayer.id },
          data: { teamId: team.id },
        });
      }
    }

    // 제거할 선수 처리
    if (removePlayers && removePlayers.length > 0) {
      for (const playerId of removePlayers) {
        // 선수 확인 및 팀 소속 여부 확인
        const userPlayer = await prisma.userPlayer.findFirst({
          where: {
            id: Number(playerId),
            userId,
            teamId: team.id,
          },
        });
        if (!userPlayer) {
          return res.status(400).json({ message: `ID가 ${playerId}인 선수를 제거할 수 없습니다.` });
        }

        // 선수의 팀 소속 해제
        await prisma.userPlayer.update({
          where: { id: userPlayer.id },
          data: { teamId: null },
        });
      }
    }

    res.json({ message: '팀이 성공적으로 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

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

    res.json({ teams });
  } catch (error) {
    next(error);
  }
};
