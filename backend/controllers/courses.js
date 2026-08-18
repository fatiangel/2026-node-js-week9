const { IsNull, MoreThan, LessThanOrEqual } = require('typeorm')
const { dataSource } = require('../db/data-source')

const courseController = {
    // GET /api/courses（公開，不用登入）：全站「進行中」課程，口徑 start_at <= now < end_at
    async getCourses (req, res, next) {
        try {
            const now = new Date()
            const courses = await dataSource.getRepository('Course').find({
                where: {
                    start_at: LessThanOrEqual(now),
                    end_at: MoreThan(now)
                },
                relations: { user: true, skill: true }
            })
            res.status(200).json({
                status: 'success',
                data: courses.map((course) => ({
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    start_at: course.start_at,
                    end_at: course.end_at,
                    max_participants: course.max_participants,
                    coach_name: course.user.name,
                    skill_name: course.skill.name
                }))
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = courseController
