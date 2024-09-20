import prisma from '../utils/prisma.js';

const calculateEnhancedValue = (baseValue, level) => {
  let mult = 1;
  if (level === 0) mult = 1.0;
  else if (level >= 1 && level <= 3) mult = 1.1;
  else if (level >= 4 && level <= 6) mult = 1.3;
  else if (level >= 7 && level <= 8) mult = 1.7;

  return Math.floor(baseValue * mult);
};

export const enhancePlayer = async (req, res, next) => {
  const { userId } = req.user;
  const { userPlayerId } = req.params;

  try {
    // 유저의 선수 가져오기
    const userPlayer = await prisma.userPlayer.findFirst({
      where: { id: parseInt(userPlayerId), userId },
      include: { player: true },
    });

    if (!userPlayer) {
      return res.status(404).json({ message: '선수를 찾을 수 없습니다.' });
    }

    if (userPlayer.level >= 8) {
      return res.status(400).json({ message: '최대 레벨에 도달했습니다.' });
    }

    // 레벨별 성공 확률 정의
    const successRates = {
      0: 0.95, // 레벨 0 -> 1: 95% 성공률
      1: 0.9, // 레벨 1 -> 2: 90%
      2: 0.8,
      3: 0.7,
      4: 0.6,
      5: 0.5,
      6: 0.4,
      7: 0.3,
      8: 0.2,
    };

    const currentLevel = userPlayer.level;
    const successRate = successRates[currentLevel];

    const isSuccess = Math.random() < successRate;

    let newLevel = currentLevel;
    let message = '';

    if (isSuccess) {
      newLevel += 1;
      message = `강화에 성공했습니다! 새로운 레벨: ${newLevel}`;

      // 기존 및 새로운 가치 계산
      const baseValue = userPlayer.value;
      console.log(typeof baseValue);
      const oldValue = userPlayer.value;
      const newValue = calculateEnhancedValue(baseValue, newLevel);

      // 선수 레벨 및 가치 업데이트
      await prisma.$transaction(async (prisma) => {
        // UserPlayer 업데이트
        await prisma.userPlayer.update({
          where: { id: userPlayer.id },
          data: {
            level: newLevel,
            value: newValue,
          },
        });

        // 유저의 총 선수 가치 업데이트
        const valueDiff = newValue - oldValue;

        await prisma.user.update({
          where: { id: userId },
          data: {
            totalValue: { increment: valueDiff },
          },
        });
      });
    } else {
      message = '강화에 실패했습니다.';
    }

    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};
