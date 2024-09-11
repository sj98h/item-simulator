import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import UsersRouter from "./src/routes/users.router.js";
import CharacterRouter from "./src/routes/character.router.js";
import ItemRouter from "./src/routes/item.router.js";

// .env 파일을 읽어서 process.env에 추가합니다.
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api", [UsersRouter, CharacterRouter, ItemRouter]);

app.listen(3000, () => {
  console.log("서버가 3000 포트에서 실행되고 있습니다.");
});
