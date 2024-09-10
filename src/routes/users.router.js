import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const validateId = (id) => {
  const idReg = /^[a-z0-9]+$/;
  return idReg.test(id);
};

// 회원가입
router.post("/sign-up", async (req, res, next) => {
  try {
    const { userId, password, passwordConfirm } = req.body;

    // 아이디 유효성
    if (!validateId(userId)) {
      return res
        .status(400)
        .json({ message: "아이디는 영어 소문자와 숫자만 포함해야 합니다." });
    }

    // 아이디 중복
    const isExistUser = await prisma.user.findFirst({
      where: { userId },
    });
    if (isExistUser)
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });

    // 비밀번호 유효성
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "비밀번호는 최소 6자 이상이어야 합니다." });
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: "비밀번호 확인이 일치하지 않습니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: { userId, password: hashedPassword },
        });

        return [user];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res
      .status(201)
      .json({
        message: "회원가입이 완료되었습니다",
        id: user.id,
        userId: user.userId,
      });
  } catch (err) {
    next(err);
  }
});

// 로그인
router.post("/sign-in", async (req, res, next) => {
  const { userId, password } = req.body;
  const user = await prisma.user.findFirst({ where: { userId } });

  if (!user)
    return res.status(401).json({ message: "존재하지 않는 아이디입니다" });

  if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인이 성공하였습니다" });
});

export default router;
