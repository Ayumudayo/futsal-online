import prisma from '../utils/prisma.js';
import { GachaSystem } from '../models/GachaSystem.js';

const gacha = new GachaSystem();

// 최종 계산식 아님!
const calculateBaseValue = (player) =>
  player.speed + player.goalScoring + player.shotPower + player.defense + player.stamina;

// 최종 계산식 아님!
const calculateEnhancedValue = (baseValue, level) => {
  let multiplier = 1;
  if (level === 0) multiplier = 1.0;
  else if (level >= 1 && level <= 3) multiplier = 1.1;
  else if (level >= 4 && level <= 6) multiplier = 1.3;
  else if (level >= 7 && level <= 8) multiplier = 1.7;

  return Math.floor(baseValue * multiplier);
};

export const drawPlayer = async (req, res, next) => {
  try {
    const player = gacha.pull();
    const baseValue = calculateBaseValue(player);
    const enhancedValue = calculateEnhancedValue(baseValue, 0); // 초기 레벨은 0으로 가정

    // Prisma를 사용하여 데이터베이스에 플레이어 저장
    const savedPlayer = await prisma.player.create({
      data: {
        ...player,
        baseValue,
        enhancedValue,
        level: 0,
        userId: req.user.id, // 요청을 보낸 사용자의 ID (인증 미들웨어 필요)
      },
    });

    res.json(savedPlayer);
  } catch (error) {
    next(error);
  }
};

export const performMultiPull = async (req, res, next) => {
  try {
    const times = parseInt(req.params.times);
    const results = [];

    for (let i = 0; i < times; i++) {
      const player = gacha.pull();
      const baseValue = calculateBaseValue(player);
      const enhancedValue = calculateEnhancedValue(baseValue, 0);

      const savedPlayer = await prisma.player.create({
        data: {
          ...player,
          baseValue,
          enhancedValue,
          level: 0,
          userId: req.user.id,
        },
      });

      results.push(savedPlayer);
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getPulledPlayers = async (req, res, next) => {
  try {
    const players = await prisma.player.findMany({
      where: { userId: req.user.id },
    });
    res.json(players);
  } catch (error) {
    next(error);
  }
};
