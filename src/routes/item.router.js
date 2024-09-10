import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 아이템 생성
router.post("/item-create", async (req, res, next) => {
  try {
    const { itemCode, name, stats, itemPrice, inventoryId } = req.body;

    // 데이터 유효성 검사
    if (!itemCode || !name || !stats || !itemPrice) {
      return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
    }

    // 아이템 코드 중복
    const existItem = await prisma.item.findFirst({
      where: { itemCode },
    });
    if (existItem) {
      return res
        .status(409)
        .json({ message: "이미 존재하는 아이템 코드입니다." });
    }

    // 아이템 이름 중복
    const existItemName = await prisma.item.findFirst({
      where: { name },
    });
    if (existItemName) {
      return res
        .status(409)
        .json({ message: "이미 존재하는 아이템 이름입니다." });
    }

    // 아이템 생성
    const newItem = await prisma.item.create({
      data: {
        itemCode,
        name,
        stats,
        itemPrice,
      },
    });

    return res.status(201).json({
      message: "아이템이 성공적으로 생성되었습니다.",
      item: newItem,
    });
  } catch (err) {
    next(err);
  }
});

// 아이템 수정 (name과 stats만)
router.patch("/item/:itemCode", async (req, res, next) => {
  const { itemCode } = req.params;
  const { name, stats } = req.body;

  try {
    const itemCodeInt = +itemCode;

    // 아이템이 존재하는지 확인
    const item = await prisma.item.findFirst({
      where: { itemCode: itemCodeInt },
    });
    if (!item) {
      return res.status(404).json({ message: "아이템을 찾을 수 없습니다." });
    }

    // 아이템 업데이트
    const updatedItem = await prisma.item.update({
      where: { itemCode: itemCodeInt },
      data: {
        name: name || item.name, // 입력 안한 경우 item.name 유지
        stats: stats || item.stats,
      },
    });

    return res.status(200).json({
      message: "아이템이 성공적으로 업데이트되었습니다.",
      item: updatedItem,
    });
  } catch (err) {
    next(err);
  }
});

// 아이템 목록 조회
router.get("/items", async (req, res, next) => {
  try {
    // 모든 아이템을 조회
    const items = await prisma.item.findMany({
      select: {
        itemCode: true,
        name: true,
        itemPrice: true,
      },
    });

    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
