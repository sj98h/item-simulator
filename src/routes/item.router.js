import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

// 아이템 생성
router.post("/item-create", async (req, res, next) => {
  try {
    const { itemCode, name, stats, itemPrice } = req.body;

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
router.patch("/item-edit/:itemCode", async (req, res, next) => {
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
router.get("/item-list", async (req, res, next) => {
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

// 아이템 상세 조회
router.get("/item-list/:itemCode", async (req, res, next) => {
  const { itemCode } = req.params;

  try {
    const item = await prisma.item.findFirst({
      where: {
        itemCode: +itemCode,
      },
      select: {
        itemCode: true,
        name: true,
        stats: true,
        itemPrice: true,
      },
    });

    // 아이템 없을 때
    if (!item) {
      return res.status(404).json({ message: "아이템을 찾을 수 없습니다." });
    }

    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
});

// 아이템 구매
/**
 * 1. 캐릭터 확인
 * 2. 구매할 아이템 가격 계산
 * 3. 돈 있는지 체크
 * 4. 인벤에 기존 아이템 있는지 체크
 * 4-1 있으면 수량만 올리기
 * 4-2 없으면 인벤토리에 아이템 추가
 * 돈 차감 + 아이템 추가 트랜잭션 처리
 */
router.post(
  "/purchase/:characterId",
  authMiddleware,
  async (req, res, next) => {
    const { characterId } = req.params;
    const items = req.body; // 구매할 아이템 배열

    try {
      // 캐릭터 조회
      const character = await prisma.character.findFirst({
        where: { id: +characterId },
        include: { inventory: true }, // 인벤토리 같이 조회
      });

      if (!character) {
        return res.status(404).json({ message: "캐릭터가 존재하지 않습니다." });
      }

      // 아이템 총 가격
      let totalCost = 0;

      for (const el of items) {
        const itemDetail = await prisma.item.findFirst({
          where: { itemCode: el.itemCode },
          select: { itemPrice: true },
        });

        if (!itemDetail) {
          return res.status(400).json({
            error: `잘못된 아이템 코드입니다.`,
          });
        }

        const itemPrice = itemDetail.itemPrice;
        totalCost += itemPrice * el.count;
      }

      // 돈 없을 때 처리
      if (character.money < totalCost) {
        return res.status(400).json({ error: "구매할 돈이 부족합니다." });
      }

      // 트랜잭션 돈 차감 ~ 아이템 추가
      await prisma.$transaction(
        async (tx) => {
          // 돈 차감
          await tx.character.update({
            where: { id: +characterId },
            data: { money: character.money - totalCost },
          });

          // 인벤 아이템 추가
          for (let el of items) {
            const existingItem = await tx.item.findFirst({
              where: { itemCode: el.itemCode },
            });

            // 아이템이 이미 존재하면 수량만 업데이트
            if (existingItem) {
              await tx.item.update({
                where: { itemCode: el.itemCode },
                data: {
                  count: existingItem.count + el.count,
                },
              });
            } else {
              // 아이템 없으면 새로 추가
              await tx.item.create({
                data: {
                  itemCode: el.itemCode,
                  name: el.name,
                  itemPrice: el.itemPrice,
                  stats: el.stats,
                  count: el.count,
                  inventoryId: character.inventory.id, // 인벤토리에 추가
                },
              });
            }
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      // 인벤토리 조회 API
      router.get(
        "/inventory/:characterId",
        authMiddleware,
        async (req, res, next) => {
          try {
            const userId = req.user.userId;
            const { characterId } = req.params;
            const character = await prisma.character.findFirst({
              where: { id: +characterId },
              include: { inventory: { include: { items: true } } }, // 인벤토리, 아이템 조회
            });

            // 다른 유저일 경우
            if (userId !== character.userId)
              return res.status(401).json({
                message: "본인 캐릭터 인벤토리만 조회할 수 있습니다.",
              });

            if (!character) {
              return res
                .status(404)
                .json({ error: "캐릭터가 존재하지 않습니다." });
            }

            // 인벤토리 아이템 반환 stats, itemPrice, inventoryId 제외
            return res.status(200).json({
              characterId: character.id,
              inventory: {
                id: character.inventory.id,
                items: character.inventory.items.map(
                  ({ stats, itemPrice, inventoryId, ...item }) => ({
                    ...item,
                  })
                ),
              },
            });
          } catch (err) {
            next(err);
          }
        }
      );

      return res.status(200).json({ message: "구매 완료" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
