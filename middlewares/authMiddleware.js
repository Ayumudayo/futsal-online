import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const { JWT_SECRET } = process.env;

    if (!authorization) {
      return res.status(401).json({ message: '토큰이 존재하지 않습니다.' });
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2) {
      return res.status(401).json({ message: '올바르지 않은 인증 헤더 형식입니다.' });
    }

    const [tokenType, token] = parts;

    if (tokenType !== 'Bearer') {
      return res.status(401).json({ message: '토큰 타입이 일치하지 않습니다.' });
    }

    // 토큰 검증
    const decodedToken = jwt.verify(token, JWT_SECRET);

    // decodedToken에서 userId 추출 및 검증
    const userId = decodedToken.userId;
    if (typeof userId !== 'number' || userId <= 0) {
      return res.status(401).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ message: '토큰 사용자가 존재하지 않습니다.' });
    }

    // req.user에 사용자 정보 설정
    req.user = { userId: user.id };

    next();
  } catch (error) {
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '토큰이 조작되었습니다.' });
      default:
        return res.status(401).json({ message: error.message || '비정상적인 요청입니다.' });
    }
  }
};

export default authMiddleware;
