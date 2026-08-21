const { dataSource } = require("../db/data-source");
const { isValidString, isValidInteger } = require("../utils/validUtils");
const appError = require("../utils/appError");

const creditPackageController = {
    async getCreditPackages(req, res, next) {
        try {
            // 回傳全部堂數方案，不需登入。
            // 前端的「健身方案」頁直接吃這份資料。 
            // ⚠️ price 的型別：答案版回的是數字字串（例如 "1400.00"），你回數字（例如 1400）也可以——前端兩種都處理得了，不構成驗收差異。
            // 文件範例照答案版寫字串。
            const creditPackages = await dataSource.getRepository("CreditPackage").find({
                select: {id: true, name: true, credit_amount: true, price: true},
            });
            // code	Description
            // 200	成功取得技能列表（還沒有任何技能時回空陣列 []，不是錯誤）
            res.status(200).json({
                status: "success",
                data: creditPackages,
            });
        } catch (error) {
            next(error);
        }
    },

    async postCreditPackage(req, res, next) {
        try {
            // 新增一筆堂數方案，不需登入（課程簡化的管理端點；前端頁面沒有呼叫它，但它是把「健身方案」資料種進系統的唯一入口——不先用這支種資料，方案頁會永遠空白、購買流程也無從驗收）。
            //  方案名稱不可重複。credit_amount 與 price 都必須是 0 以上的整數（數字型別）——price 請送數字，不要送字串，送字串會被擋 400。 
            // ⚠️ 成功狀態碼是 200，不是 201（答案版實際行為）。
            // 驗收只看「成功 2xx ＋ status 欄位」，回 201 也算過。
            const { name, credit_amount, price } = req.body;
            if (!isValidString(name) || !isValidInteger(credit_amount) || !isValidInteger(price)) {
                return next(appError(400, "欄位未填寫正確"));
            }
            const repo = dataSource.getRepository("CreditPackage");
            const existingCreditPackage = await repo.findOneBy({ name: name.trim() });
            if (existingCreditPackage) {
                return next(appError(409, "資料重複"));
            }
            const newCreditPackage = await repo.save({
                name,
                credit_amount,
                price
            });
            // Code	Description
            // 200	新增成功，回傳完整的技能資料（含後端產生的 id 與建立時間）
            res.json({
                status: "success",
                data: {
                    id: newCreditPackage.id,
                    name: newCreditPackage.name,
                    createdAt: newCreditPackage.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    // Code	Description
    // 401	觸發條件：登入驗證沒過。下方是建議回應範例；驗收重點是 4xx + status: failed。 只有「請先登入」是固定錯誤訊息文字，必須完全相同。
    // 已在 isAuth()中, 處理.
    async postCreditPackageId(req, res, next) {
        try {
            // 登入的使用者購買指定方案，替自己加值堂數。
            // body 完全留空——購買的堂數與金額由後端依 creditPackageId 從方案資料帶入，
            // 前端不送也不能送（設計理由：金額如果由前端送，使用者改一下封包就能 1 元買 100 堂）。 
            // 購買後沒有「剩餘堂數」欄位可以直接查：剩餘堂數＝歷次購買堂數加總 − 未取消的報名數，由後端即時計算（見 M5 報名相關端點）。 
            // ⚠️ 固定錯誤訊息文字：未帶 token 打這支時，錯誤訊息必須一字不差回「請先登入」——前端靠這句文字決定要不要把使用者導去登入頁，多一個字、少一個標點都會讓前端壞掉。 
            // 驗收只看「成功 2xx／失敗 4xx ＋ status 欄位」＋上述固定錯誤訊息文字，狀態碼數字為參考值。
            const { creditPackageId } = req.params;
            const repo = dataSource.getRepository("CreditPackage");
            const packageIdRepo = await repo.findOneBy({ id: creditPackageId });
            // Code	Description
            // 400	觸發條件：creditPackageId 查無對應方案
            if (!packageIdRepo) {
                return next(appError(400, "ID錯誤"));
            }

            const purchaseRepo = dataSource.getRepository("CreditPurchase");
            await purchaseRepo.save({
                user_id: req.user.id,
                credit_package_id: packageIdRepo.id,
                purchased_credits: packageIdRepo.credit_amount,
                price_paid: packageIdRepo.price,
            });
            // Code	Description
            // 200	購買成功，data 固定回 null（不回購買明細）
            res.json({
                status: "success",
                data: null
            });
        } catch (error) {
            next(error);
        }
    },

    // M1-6
    async deleteCreditPackageId(req, res, next) {
        try {
            const { creditPackageId } = req.params;
            const creditPackageRepo = dataSource.getRepository("CreditPackage");
            const delCreditPackage = await creditPackageRepo.delete({ id: creditPackageId });
            if (delCreditPackage.affected === 0) {
                return next(appError(400, "ID錯誤"));
            }
            res.status(200).json({
                status: "success",
                //   data: {
                //    raw: delCreditPackage.raw,
                //    affected: delCreditPackage.affected,
                //},
                data: delCreditPackage,
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = creditPackageController;