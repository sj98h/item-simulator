import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import UsersRouter from "./src/routes/users.router.js";
import CharacterRouter from "./src/routes/character.router.js";

// .env 파일을 읽어서 process.env에 추가합니다.
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

// JWT 비밀 키
const JWT_SECRET = process.env.JWT_SECRET; // 환경 변수에서 비밀 키 가져오기

// Middleware: JWT 인증
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API 엔드포인트

// 아이템 조회
app.get("/items/:userId", authenticateJWT, async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const items = await prismaClient.item.findMany({
      where: { character: { userId: userId } },
      include: { character: true },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// 아이템 시뮬레이션
app.post("/simulate", authenticateJWT, async (req, res) => {
  const { characterId, itemData } = req.body;
  try {
    const item = await prismaClient.item.create({
      data: {
        characterId: characterId,
        name: itemData.name,
        stats: itemData.stats,
      },
    });
    // 시뮬레이션 로직 추가
    res.json({ success: true, item: item });
  } catch (error) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// 아이템 비교
app.get("/compare/:userId1/:userId2", authenticateJWT, async (req, res) => {
  const userId1 = parseInt(req.params.userId1);
  const userId2 = parseInt(req.params.userId2);
  try {
    const items1 = await prismaClient.item.findMany({
      where: { character: { userId: userId1 } },
      include: { character: true },
    });
    const items2 = await prismaClient.item.findMany({
      where: { character: { userId: userId2 } },
      include: { character: true },
    });
    // 비교 로직 추가
    res.json({ userId1Items: items1, userId2Items: items2 });
  } catch (error) {
    res.status(500).json({ error: "서버 오류" });
  }
});

app.use("/api", [UsersRouter, CharacterRouter]);

app.listen(3000, () => {
  console.log("서버가 3000 포트에서 실행되고 있습니다.");
});
