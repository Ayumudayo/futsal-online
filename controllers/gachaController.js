import prisma from '../utils/prisma.js';

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
    // 가챠 로직 구현
  } catch (error) {
    next(error);
  }
};
