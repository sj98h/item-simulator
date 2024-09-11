import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function authenticateJWT(req, res, next) {
  try {
    const { authorization } = req.cookies; // 쿠키에서 authorization을 읽어옵니다.

    if (!authorization) return next();

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer") return res.sendStatus(401); // 토큰 타입이 맞지 않으면 401 응답

    // JWT 검증
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      res.clearCookie("authorization"); // 사용자 정보가 없으면 쿠키 삭제
      return res.sendStatus(401); // 사용자 정보가 없으면 401 응답
    }

    // 사용자 정보를 req.user에 저장
    req.user = user;

    // 다음 미들웨어로 진행
    next();
  } catch (error) {
    return res.status(401).json({ message: "비정상적인 요청입니다." });
  }
}
