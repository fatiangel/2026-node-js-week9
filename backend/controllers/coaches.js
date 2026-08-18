const { MoreThan } = require('typeorm')
const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const { isUndefined, isValidString } = require('../utils/validUtils')

const coachController = {
    // GET /api/coaches?per=&page=（公開，不用登入）
    async getCoaches (req, res, next) {
        try {
            const { per, page } = req.query
            if (!/^\d+$/.test(per) || !/^\d+$/.test(page)) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const perToInt = parseInt(per, 10)
            const pageToInt = parseInt(page, 10)
            const coaches = await dataSource.getRepository('Coach').find({
                select: {
                    id: true,
                    user_id: true,
                    user: { name: true }
                },
                relations: { user: true },
                take: perToInt,
                skip: (pageToInt - 1) * perToInt
            })
            res.status(200).json({
                status: 'success',
                data: coaches.map((coach) => ({
                    id: coach.id,
                    user_id: coach.user_id,
                    name: coach.user.name
                }))
            })
        } catch (error) {
            next(error)
        }
    },

    // GET /api/coaches/:coachId（公開，不用登入）
    async getCoachDetail (req, res, next) {
        try {
            const { coachId } = req.params
            if (isUndefined(coachId) || !isValidString(coachId)) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const coach = await dataSource.getRepository('Coach').findOne({
                where: { id: coachId },
                relations: { user: true, CoachLinkSkill: { Skill: true } }
            })
            if (!coach) {
                return next(appError(400, '找不到該教練'))
            }
            res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        name: coach.user.name,
                        role: coach.user.role
                    },
                    coach: {
                        id: coach.id,
                        user_id: coach.user_id,
                        experience_years: coach.experience_years,
                        description: coach.description,
                        profile_image_url: coach.profile_image_url,
                        created_at: coach.createdAt,
                        updated_at: coach.updatedAt,
                        skills: coach.CoachLinkSkill.map((link) => link.Skill.name)
                    }
                }
            })
        } catch (error) {
            next(error)
        }
    },

    // GET /api/coaches/:coachId/courses（公開，不用登入）
    async getCoachCourses (req, res, next) {
        try {
            const { coachId } = req.params
            if (isUndefined(coachId) || !isValidString(coachId)) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const coach = await dataSource.getRepository('Coach').findOne({
                where: { id: coachId }
            })
            if (!coach) {
                return next(appError(400, '找不到該教練'))
            }
            const courses = await dataSource.getRepository('Course').find({
                where: {
                    user_id: coach.user_id,
                    end_at: MoreThan(new Date())
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

module.exports = coachController
