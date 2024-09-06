const express = require('express');
const router = express.Router();
const prisma = require('@prisma/client').PrismaClient;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prismaClient = new prisma();
const JWT_SECRET = 'your_jwt_secret_key'; // 비밀 키를 환경 변수에서 가져오는 것이 좋습니다.

// 회원가입
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prismaClient.user.create({
      data: {
        username: username,
        passwordHash: hashedPassword,
      },
    });
    res.status(201).json({ message: '회원가입 성공', user: newUser });
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prismaClient.user.findUnique({
      where: { username: username },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: '잘못된 자격 증명' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: token });
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
