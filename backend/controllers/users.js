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

            // 3. 帳號不存在「或」密碼比對錯誤
            // （⚠️ 兩種情況共用同一句，避免洩漏帳號是否存在）：「使用者不存在或密碼輸入錯誤」
            const userRepo = dataSource.getRepository("User");
            // 3-1. 帳號不存在
            const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });
            // 3-2. 密碼比對錯誤
            const isMatched = findUser && await bcrypt.compare(password.trim(), findUser.password);
            if (!findUser || !isMatched) {
                return next(appError(400, "使用者不存在或密碼輸入錯誤"));
            }

            // jwtSecret: process.env.JWT_SECRET || "mysecretkey",
            // jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "7d",
            const token = jwt.sign(
                {
                    id: findUser.id, 
                    role: findUser.role
                },
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

    async getUserProfile(req, res, next) {
        // req.user 是 isAuth middleware 掛上去的，裡面有 id、name、email、role、createdAt、updatedAt
        // isAuth 已經確認過使用者存在（查無此人會在那裡回 401「無效的 token」），這裡不用再查一次
        try {
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

    async updateUserProfile(req, res, next) {
        try {
            const { name } = req.body;
            // 觸發條件：name 缺漏或為空字串
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

    async changeUserPassword(req, res, next) {
        try {
            const { password, new_password, confirm_new_password } = req.body;

            // 觸發條件：1. 三個欄位任一缺漏或為空字串：「欄位未填寫正確」
            if (!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)) {
                return next(appError(400, "欄位未填寫正確"));
            }

            // 觸發條件：2. 三個欄位全部都要符合密碼規則：「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
            if (!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)) {
                return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
            }

            // 觸發條件：3. 新密碼不能與舊密碼相同：「新密碼不能與舊密碼相同」
            if (new_password === password) {
                return next(appError(400, "新密碼不能與舊密碼相同"));
            }
            // 觸發條件：新密碼與驗證新密碼不一致：「新密碼與驗證新密碼不一致」
            if (new_password !== confirm_new_password) {
                return next(appError(400, "新密碼與驗證新密碼不一致"));
            }

            const userRepo = dataSource.getRepository("User");
            const findUser = await userRepo.findOneBy({ id: req.user.id });

            // 觸發條件：4. 舊密碼比對錯誤：「密碼輸入錯誤」
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
    },

    // Code	Description
    // 401	token 驗證失敗。下方是建議回應範例；驗收重點是 4xx + status: failed。
    // 只有「請先登入」是固定錯誤訊息文字，必須完全相同。
    // * 沒帶 Authorization header、或格式不是 Bearer ：「請先登入」
    // * token 已過期：「Token 已過期」
    // * token 無效（內容不對、或查無此使用者）：「無效的 token」 ⚠️「請先登入」是四句固定錯誤訊息文字之一，一個字都不能改。
    // 已在 isAuth()中, 處理.
    async getUserCreditPackages(req, res, next) {
        // 回傳目前登入者買過的所有堂數方案紀錄。
        // data 直接是「陣列」（不是物件包陣列）， 沒買過任何方案時回空陣列 []。

        // 行為備註：
        // 每筆形狀固定：{ name（方案名稱）, purchased_credits（買到的堂數）, price_paid（付了多少錢，數字）, purchase_at（購買時間）}。
        // ⚠️ price_paid 回「數字」型別（例如 1400，不是字串 "1400.00"）。
        // 排序：依 purchase_at 新到舊（最新買的排最前面）。
        try {
            const purchases = await dataSource.getRepository("CreditPurchase").find({
                where: { user_id: req.user.id },
                relations: { CreditPackage: true },
                order: { purchaseAt: "DESC" },
            });
            res.status(200).json({
                status: "success",
                data: purchases.map((purchase) => ({
                    name: purchase.CreditPackage.name,
                    purchased_credits: purchase.purchased_credits,
                    price_paid: purchase.price_paid,
                    purchase_at: purchase.purchaseAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    },

    // Code	Description
    // 401	token 驗證失敗。
    // 下方是建議回應範例；驗收重點是 4xx + status: failed。
    // 只有「請先登入」是固定錯誤訊息文字，必須完全相同。
    // a. 沒帶 Authorization header、或格式不是 Bearer ：「請先登入」
    // b. token 已過期：「Token 已過期」
    // c. token 無效（內容不對、或查無此使用者）：「無效的 token」 ⚠️「請先登入」是四句固定錯誤訊息文字之一，一個字都不能改。
    // 已在 isAuth()中, 處理.
    async getUserCourses(req, res, next) {
        // 回傳目前登入者的剩餘堂數、已使用堂數、以及所有報名過的課程清單（含已取消）。
        // data 形狀固定三個欄位：
        // a. credit_remain：剩餘堂數
        // b. credit_usage：已使用堂數
        // c. course_booking：報名紀錄陣列
        
        // 行為備註：
        // a. ⚠️ credit_remain 的口徑：剩餘堂數 ＝「全部購買的堂數加總」−「未取消的報名數」。 
        // 沒有任何地方存「餘額」這個欄位，每次都要用這條公式現算； 已取消的報名不佔堂數（取消會把堂數還回來）。
        // b. credit_usage ＝ 未取消的報名數（跟上面公式的右半邊是同一個數字）。
        // c. ⚠️ course_booking「包含已取消的報名」——cancelled_at 有值代表已取消、null 代表有效。 前端靠 cancelled_at 來顯示狀態，不要自作主張把已取消的過濾掉。
        // d. 排序：依課程 start_at 由舊到新（ASC）。
        // e. 每筆形狀：{ course_id, name, start_at, end_at, meeting_url, coach_name, cancelled_at }， coach_name 是開課教練的名稱、course_id 是 uuid 字串。
        try {
            const purchases = await dataSource.getRepository("CreditPurchase").find({
                where: { user_id: req.user.id },
            });
            const totalPurchasedCredits = purchases.reduce(
                (sum, purchase) => sum + purchase.purchased_credits,
                0
            );

            const bookings = await dataSource.getRepository("CourseBooking").find({
                where: { user_id: req.user.id },
                relations: { course: { user: true } },
                order: { course: { start_at: "ASC" } },
            });
            const activeBookingCount = bookings.filter((booking) => !booking.cancelledAt).length;

            res.status(200).json({
                status: "success",
                data: {
                    credit_remain: totalPurchasedCredits - activeBookingCount,
                    credit_usage: activeBookingCount,
                    course_booking: bookings.map((booking) => ({
                        course_id: booking.course.id,
                        name: booking.course.name,
                        start_at: booking.course.start_at,
                        end_at: booking.course.end_at,
                        meeting_url: booking.course.meeting_url,
                        coach_name: booking.course.user.name,
                        cancelled_at: booking.cancelledAt,
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    },

};

module.exports = userController;