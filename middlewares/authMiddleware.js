import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const authenicateToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const { JWT_SECRET } = process.env;

    if (!authorization) throw new Error('토큰이 존재하지 않습니다.');

    const [tokenType, token] = authorization.split(' ');

    if (tokenType !== 'Bearer') throw new Error('토큰 타입이 일치하지 않습니다.');
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const id = decodedToken.id;

    const user = await prisma.user.findFirst({
      where: { id: +id },
    });
    if (!user) {
      res.headers('authorization');
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    req.user = user;

    next();
  } catch (error) {
    res.headers('authorization');

    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '토큰이 조작되었습니다.' });
      default:
        return res.status(401).json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
};
