const { dataSource } = require("../db/data-source");
const { isValidString, isValidInteger } = require("../utils/validUtils");
const appError = require("../utils/appError");

const creditPackageController = {
    async getAllCreditPackages(req, res, next) {
        try {
            const creditPackages = await dataSource.getRepository("CreditPackage").find({
                select: {id: true, name: true, credit_amount: true, price: true},
            });
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
            const { name, credit_amount, price } = req.body;
            // 觸發條件：任一欄位沒給；name 不是字串或為空；credit_amount 或 price 不是數字、是負數、或帶小數
            if (!isValidString(name) || !isValidInteger(credit_amount) || !isValidInteger(price)) {
                return next(appError(400, "欄位未填寫正確"));
            }

            const creditPackageRepo = dataSource.getRepository("CreditPackage");
            const findCreditPackage = await creditPackageRepo.findOneBy({ name: name.trim() });
            
            // 觸發條件：name 與既有方案重複
            if(findCreditPackage) { return next(appError(409, "資料重覆")); }
            
            const newCreditPackage = await creditPackageRepo.save({ name: name.trim(), credit_amount: credit_amount, price: price });

            res.status(201).json({
                status: "success",
                data: newCreditPackage,
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteCreditPackage(req, res, next) {
        try {
            const { creditPackageId } = req.params;
            const creditPackageRepo = dataSource.getRepository("CreditPackage");
            const delCreditPackage = await creditPackageRepo.delete({ id: creditPackageId });
            if (delCreditPackage.affected === 0) {
                return next(appError(400, "ID錯誤"));
            }
            res.status(200).json({
                status: "success",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = creditPackageController;