const express = require('express')

const router = express.Router()
const coachController = require("../controllers/coaches");

// M4 1 + 2 + 3
router.get("/", coachController.getCoaches);
router.get("/:coachId", coachController.getCoachDetail);
router.get("/:coachId/courses", coachController.getCoachCourses);

module.exports = router;