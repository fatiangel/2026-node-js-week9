const express = require('express')

const router = express.Router()
const isAuth = require('../middlewares/isAuth')
const isCoach = require('../middlewares/isCoach')
const adminController = require('../controllers/admin')

// M3 2 + 3
router.get('/coaches', isAuth, isCoach, adminController.getCoachProfile)
router.put('/coaches', isAuth, isCoach, adminController.putCoachProfile)
// M3 4 + 5
router.get('/coaches/courses', isAuth, isCoach, adminController.getCoachCourses)
router.post('/coaches/courses', isAuth, isCoach, adminController.postCourse)
// M6 1
router.get('/coaches/revenue', isAuth, isCoach, adminController.getCoachRevenue)

// ⚠️ 動態參數路由要放最後，否則 /coaches/courses、/coaches/revenue 這些固定路徑
// 會先被這裡的 :userId 吃掉（express 依註冊順序比對路由）

// M3 6 + 7
router.get('/coaches/courses/:courseId', isAuth, adminController.getCoachCourseDetail)
router.put('/coaches/courses/:courseId', isAuth, adminController.putCoachCourseDetail)
// M3 1
router.post('/coaches/:userId', adminController.postCoach)

module.exports = router