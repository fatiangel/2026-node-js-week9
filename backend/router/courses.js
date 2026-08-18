const express = require('express')

const router = express.Router()
const courseController = require('../controllers/courses')

// M4
router.get('/', courseController.getCourses)

module.exports = router
