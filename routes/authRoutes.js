import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const router = express.Router();

//** 회원가입 */

router.post('/signup', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      error: 'username , password를 입력하세요.',
    });
  }
  const usernameRegex = /^[a-z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error: 'username 을 소문자와 숫자를 혼합하여 사용하세요.',
    });
  }

  if (password.length < 6)
    return res.status(409).send({ message: '비밀번호를 다시 작성해주세요.' });

  const ExistUsername = await prisma.user.findFirst({
    where: {
      username,
    },
  });
  if (ExistUsername) {
    return res.status(400).json({ message: '이미 존재하는 username 입니다.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashedPassword },
  });

  return res.status(201).json({ message: '회원가입 성공.' });
});

//** 로그인 */

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  const users = await prisma.user.findFirst({ where: { username } });

  if (!users) return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
  else if (!(await bcrypt.compare(password, users.password)))
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

  const token = jwt.sign(
    {
      userId: users.userId,
    },
    'MY_JWT_SECRET_KEY',
  );

  res.header('authorization', `Bearer ${token}`);
  return res.status(200).json({ message: '로그인 되었습니다.' });
});
export default router;
