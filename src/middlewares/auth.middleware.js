import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
    try {
        // Authorization 헤더에서 JWT 추출
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("로그인이 필요합니다.");
        }

        const token = authHeader.split(" ")[1];

        // JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            throw new Error("유효하지 않은 토큰입니다.");
        }

        const userId = decoded.userId;

        // DB에서 사용자 정보 조회
        const user = await prisma.user.findFirst({
            where: { userId: +userId },
        });
        if (!user) {
            res.clearCookie("authorization");
            throw new Error("토큰 사용자가 존재하지 않습니다.");
        }

        // req.user에 사용자 정보를 저장
        req.user = user;

        // 다음 미들웨어로 진행
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ message: error.message ?? "비정상적인 요청입니다." });
    }
}
