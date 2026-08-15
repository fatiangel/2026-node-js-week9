const { dataSource } = require("../db/data-source");
const { isValidString } = require("../utils/validUtils");
const appError = require("../utils/appError");

const skillController = {
    async getAllSkills(req, res, next) {
        try {
            const skills = await dataSource.getRepository("Skill").find({
                select: {id: true, name: true},
            });
            res.status(200).json({
                status: "success",
                data: skills,
            });
        } catch (error) {
            next(error);
        }
    },
    async postSkill(req, res, next) {
        try {
            const { name } = req.body;
            // 觸發條件：沒給 name、name 不是字串、或 name 是空字串／全空白
            if(!isValidString(name)) {
                return next(appError(400, "欄位未填寫正確"));
            }

            const skillRepo = dataSource.getRepository("Skill");
            const findSkill = await skillRepo.findOneBy({ name: name.trim() });

            // 觸發條件：name 與既有技能重複
            if(findSkill) { return next(appError(409, "資料重覆")); }
            
            const newSkill = await skillRepo.save({ name: name.trim() });

            res.status(201).json({
                status: "success",
                data: newSkill,
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteSkill(req, res, next) {
        try {
            const { skillId } = req.params;
            const skillRepo = dataSource.getRepository("Skill");
            const delSkill = await skillRepo.delete({ id: skillId });
            if (delSkill.affected === 0) {
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

module.exports = skillController;