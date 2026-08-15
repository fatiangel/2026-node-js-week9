const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const { isValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userController = {
    async signup(req, res, next) {
        try {
            const { name, email, password } = req.body;
            // 欄位驗證失敗。下方是建議回應範例；驗收重點是 4xx + status: failed。
            // 觸發條件：
            // name、email、password 任一缺漏或為空字串：「欄位未填寫正確」
            if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
                return next(appError(400, "欄位未填寫正確"));
            }
            // 密碼不符合規則（缺大寫／小寫／數字、或長度不在 8～16）：「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
            if (!isValidPassword(password)) {
                return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
            }

            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });

            // 觸發條件：email 與既有使用者重複
            if(findUser) { return next(appError(409, "Email 已被使用")); }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await userRepo.save({ name: name.trim(), email: email.trim().toLowerCase(), role: "USER", password: hashedPassword });

            res.status(201).json({
                status: "success",
                data: {
                    user: {
                        id: newUser.id,
                        name: newUser.name,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            // 登入失敗。下方是建議回應範例；驗收重點是 4xx + status: failed。
            // 1. email 或 password 缺漏／空字串：「欄位未填寫正確」
            if (!isValidString(email) || !isValidString(password)) {
                return next(appError(400, "欄位未填寫正確"));
            }
            // 2. 密碼格式不符合規則（此時不會去查帳號）：「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
            if (!isValidPassword(password)) {
                return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
            }

            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });
            // 3. 帳號不存在「或」密碼比對錯誤（⚠️ 兩種情況共用同一句，避免洩漏帳號是否存在）：「使用者不存在或密碼輸入錯誤」
            const isMatched = findUser && await bcrypt.compare(password.trim(), findUser.password);
            if (!findUser || !isMatched) {
                return next(appError(400, "使用者不存在或密碼輸入錯誤"));
            }

            // jwtSecret: process.env.JWT_SECRET || "mysecretkey",
            // jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "7d",
            const token = jwt.sign(
                { id: findUser.id, role: findUser.role },
                config.get("secret.jwtSecret"),
                { expiresIn: config.get("secret.jwtExpiresDay") }
            );

            res.status(201).json({
                status: "success",
                data: {
                    token,
                    user: {
                        name: findUser.name,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    },
    async getProfile(req, res, next) {
        // req.user 是 isAuth middleware 掛上去的，裡面有 id、name、email、role、createdAt、updatedAt
        try {
            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ id: req.user.id });

            if(!findUser) { return next(appError(404, "使用者不存在")); }

            res.status(200).json({
                status: "success",
                data: {
                    user: {
                        name: req.user.name,
                        email: req.user.email,
                    },
                }
            });
        } catch (error) {
            next(error);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const { name } = req.body;
            // 觸發條件：name 沒給、不是字串、或為空字串：「欄位未填寫正確」
            if (!isValidString(name)) {
                return next(appError(400, "欄位未填寫正確"));
            }

            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ id: req.user.id });

            // 觸發條件：新名稱跟目前的名稱一模一樣：「使用者名稱未變更」
            if (findUser.name === name.trim()) {
                return next(appError(400, "使用者名稱未變更"));
            }

            const updateResult = await userRepo.update({ id: req.user.id }, { name: name.trim() });

            // 觸發條件：更新沒有生效（極少見的邊角情況）：「更新使用者資料失敗」
            if (updateResult.affected === 0) {
                return next(appError(400, "更新使用者資料失敗"));
            }

            res.status(200).json({
                status: "success",
                data: {
                    user: {
                        name: name.trim(),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    },
    async changePassword(req, res, next) {
        try {
            const { password, new_password, confirm_new_password } = req.body;

            // 1. 三個欄位任一缺漏或為空字串：「欄位未填寫正確」
            if (!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)) {
                return next(appError(400, "欄位未填寫正確"));
            }

            // 2. 三個欄位全部都要符合密碼規則：「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
            if (!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)) {
                return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
            }

            // 3. 新密碼不能與舊密碼相同：「新密碼不能與舊密碼相同」
            if (new_password === password) {
                return next(appError(400, "新密碼不能與舊密碼相同"));
            }
            // 新密碼與驗證新密碼不一致：「新密碼與驗證新密碼不一致」
            if (new_password !== confirm_new_password) {
                return next(appError(400, "新密碼與驗證新密碼不一致"));
            }

            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ id: req.user.id });

            // 4. 舊密碼比對錯誤：「密碼輸入錯誤」
            const isPasswordCorrect = await bcrypt.compare(password, findUser.password);
            if (!isPasswordCorrect) {
                return next(appError(400, "密碼輸入錯誤"));
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await userRepo.update({ id: req.user.id }, { password: hashedPassword });

            // 5. 成功
            res.status(200).json({
                status: "success",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;