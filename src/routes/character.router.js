import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 캐릭터 생성
router.post("/character-create", authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    // 캐릭터명 중복
    const isExistName = await prisma.character.findFirst({
      where: { name },
    });
    if (isExistName)
      return res.status(409).json({ message: "이미 존재하는 캐릭터명입니다." });

    const character = await prisma.character.create({
      data: { name, userId },
    });

    return res.status(201).json({
      message: "생성이 완료되었습니다",
      id: character.id,
      name: character.name,
    });
  } catch (err) {
    next(err);
  }
});

// 캐릭터 삭제
router.delete(
  "/character-delete/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      const characterId = parseInt(req.params.id);
      const userId = req.user.userId;

      // 캐릭터 존재 여부 확인
      const character = await prisma.character.findFirst({
        where: { id: characterId },
      });

      if (!character)
        return res.status(404).json({ message: "존재하지 않는 캐릭터입니다." });

      // 캐릭터 소유자 확인
      if (character.userId !== userId)
        return res
          .status(403)
          .json({ message: "이 캐릭터를 삭제할 권한이 없습니다." });

      // 캐릭터 삭제
      await prisma.character.delete({
        where: { id: characterId },
      });

      return res
        .status(200)
        .json({ message: "캐릭터가 성공적으로 삭제되었습니다." });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
