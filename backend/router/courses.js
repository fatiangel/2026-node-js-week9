const express = require('express')

const router = express.Router()
const courseController = require('../controllers/courses')
const isAuth = require('../middlewares/isAuth')

// M4 1
router.get('/', courseController.getCourses)
// M5 4 + 5
router.post('/:courseId', isAuth, courseController.postCoursesBooking)
router.delete('/:courseId', isAuth, courseController.deleteCoursesBooking)

module.exports = router
