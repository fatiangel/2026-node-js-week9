const express = require('express')

const router = express.Router()
const coachController = require("../controllers/coaches");

// M4
router.get("/", coachController.getCoaches);
router.get("/:coachId", coachController.getCoachDetail);
router.get("/:coachId/courses", coachController.getCoachCourses);

module.exports = router;