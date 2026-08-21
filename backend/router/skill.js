const skillController = require("../controllers/skill");

const router = require("express").Router();

// M1 1 + 2 + 3
router.get("/", skillController.getAllSkills);
router.post("/", skillController.postSkill);
router.delete("/:skillId", skillController.deleteSkill);

module.exports = router;