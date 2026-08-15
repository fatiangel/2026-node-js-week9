// middlewares/isAuth.js
// TokenExpiredError
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");

async function isAuth(req, res, next) {
    try {
        // 1. 從 header 取 token
        // 沒帶 Authorization header、或格式不是 Bearer ：「請先登入」
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(appError(401, "請先登入"));
        }
        // Bearer XXXXX
        const token = authHeader.split(" ")[1];
    
        // 2. 驗證 token
        const decoded = jwt.verify(token, config.get("secret.jwtSecret"));
    
        // 3. 用 decoded.id 查 User
        const userRepo = dataSource.getRepository("User");
        const user = await userRepo.findOneBy({ id: decoded.id });
        //token 無效（內容不對、或查無此使用者）：「無效的 token」 ⚠️「請先登入」是四句固定錯誤訊息文字之一，一個字都不能改。
        if (!user) {
            return next(appError(401, "無效的 token"));
        }
    
        // 4. 掛到 req.user，後續 controller 就能用
        req.user = user;
        next();
    } catch (err) {
        // token 已過期：「Token 已過期」
        if (err.name === "TokenExpiredError") {
            return next(appError(401, "Token 已過期"));
        }
        // token 無效（內容不對、或查無此使用者）：「無效的 token」 ⚠️「請先登入」是四句固定錯誤訊息文字之一，一個字都不能改。
        return next(appError(401, "無效的 token"));
    }
}
module.exports = isAuth;
