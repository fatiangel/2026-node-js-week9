const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')
const { isValidString, isValidInteger } = require('../utils/validUtils')

dayjs.extend(utc)
const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
}

const adminController = {
    async postCoach (req, res, next) {
        try {
            const { userId } = req.params
            const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
            // 400: 欄位缺漏或格式不對（experience_years 不是 0 以上的整數、description 是空字串、profile_image_url 有值但不是 https 開頭）
            // →「欄位未填寫正確」
            if (!isValidInteger(experienceYears) ||
                !isValidString(description) ||
                (profileImageUrl && (!isValidString(profileImageUrl) || !profileImageUrl.startsWith('https')))) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const userRepository = dataSource.getRepository('User')
            const existingUser = await userRepository.findOne({
                select: { id: true, name: true, role: true },
                where: { id: userId }
            })

            // 400: userId 查不到對應的使用者 →「使用者不存在」
            if (!existingUser) {
                return next(appError(400, '使用者不存在'))
            // 409: 該使用者已經是教練（重複升級）
            } else if (existingUser.role === 'COACH') {
                return next(appError(409, '使用者已經是教練'))
            }
            const coachRepo = dataSource.getRepository('Coach')
            const newCoach = coachRepo.create({
                user_id: userId,
                experience_years: experienceYears,
                description: description.trim(),
                profile_image_url: profileImageUrl
            })
            const updatedUser = await userRepository.update({
                id: userId,
                role: 'USER'
            }, {
                role: 'COACH'
            })
            if (updatedUser.affected === 0) {
                return next(appError(400, '更新使用者失敗'))
            }
            const savedCoach = await coachRepo.save(newCoach)
            res.status(201).json({
                status: 'success',
                data: {
                    user: { name: existingUser.name, role: 'COACH' },
                    coach: savedCoach
                }
            })
        } catch (error) {
            next(error)
        }
    },

    async getCoachProfile (req, res, next) {
        try {
            const { id } = req.user
            const coachRepo = dataSource.getRepository('Coach')
            const coach = await coachRepo.findOne({
                select: { id: true, experience_years: true, description: true, profile_image_url: true },
                where: { user_id: id }
            })
            if (!coach) {
                return next(appError(401, '使用者尚未成為教練'))
            }
            const coachSkill = await dataSource.getRepository('CoachLinkSkill').find({
                select: { skill_id: true },
                where: { coach_id: coach.id }
            })
            
            res.status(200).json({
                status: 'success',
                data: {
                    id: coach.id,
                    experience_years: coach.experience_years,
                    description: coach.description,
                    profile_image_url: coach.profile_image_url,
                    skill_ids: coachSkill.length > 0 ? coachSkill.map(({ skill_id: skillId }) => skillId) : []
                }
          })
        } catch (error) {
            next(error)
        }
    },

    async putCoachProfile (req, res, next) {
        try {
            const { id } = req.user
            const {
                experience_years: experienceYears,
                description,
                profile_image_url: profileImageUrl = null,
                skill_ids: skillIds
            } = req.body
            
            if (!isValidInteger(experienceYears) ||
                !isValidString(description) ||
                !isValidString(profileImageUrl) ||
                !profileImageUrl.startsWith('https') ||
                !Array.isArray(skillIds) ||
                skillIds.length === 0 ||
                skillIds.some(skill => !isValidString(skill))) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const coachRepo = dataSource.getRepository('Coach')
            const coach = await coachRepo.findOne({
                select: { id: true },
                where: { user_id: id }
            })
            if (!coach) {
                return next(appError(401, '使用者尚未成為教練'))
            }
            await coachRepo.update({
                id: coach.id
            }, {
                experience_years: experienceYears,
                description: description.trim(),
                profile_image_url: profileImageUrl
            })
            const newCoachLinkSkill = skillIds.map(skill => ({
                coach_id: coach.id,
                skill_id: skill
            }))
            await dataSource.transaction(async (manager) => {
                await manager.delete('CoachLinkSkill', { coach_id: coach.id })
                await manager.insert('CoachLinkSkill', newCoachLinkSkill)
            })
            const result = await coachRepo.find({
                select: {
                    id: true,
                    experience_years: true,
                    description: true,
                    profile_image_url: true,
                    CoachLinkSkill: { skill_id: true }
                },
                where: { id: coach.id },
                relations: { CoachLinkSkill: true }
            })
            res.status(200).json({
                status: 'success',
                data: {
                    id: result[0].id,
                    experience_years: result[0].experience_years,
                    description: result[0].description,
                    profile_image_url: result[0].profile_image_url,
                    skill_ids: result[0].CoachLinkSkill.map(skill => skill.skill_id)
                }
            })
        } catch (error) {
            next(error)
        }
    },

    async getCoachCourses (req, res, next) {
        try {
            const { id } = req.user
            const courses = await dataSource.getRepository('Course').find({
                select: {
                    id: true,
                    name: true,
                    start_at: true,
                    end_at: true,
                    max_participants: true,
                    meeting_url: true
                },
                where: { user_id: id }
            })
            if (courses.length === 0) {
                res.status(200).json({
                    status: 'success',
                    data: []
                })
                return
            }
            const courseIds = courses.map((course) => course.id)
            const coursesParticipant = await dataSource.getRepository('CourseBooking')
                .createQueryBuilder('course_booking')
                .select('course_id')
                .addSelect('COUNT(course_id)', 'count')
                .where('course_id IN (:...courseIds)', { courseIds })
                .andWhere('cancelled_at is null')
                .groupBy('course_id')
                .getRawMany()
            const now = new Date()
            res.status(200).json({
                status: 'success',
                data: courses.map((course) => {
                    const startAt = new Date(course.start_at)
                    const endAt = new Date(course.end_at)
                    let status = '尚未開始'
                    if (startAt < now) {
                        status = '進行中'
                        if (endAt < now) {
                          status = '已結束'
                        }
                    }
                    const courseParticipant = coursesParticipant.find((courseParticipant) => courseParticipant.course_id === course.id)
                    return {
                        id: course.id,
                        name: course.name,
                        status,
                        start_at: course.start_at,
                        end_at: course.end_at,
                        max_participants: course.max_participants,
                        meeting_url: course.meeting_url,
                        participants: courseParticipant ? courseParticipant.count : 0
                    }
                })
            })
        } catch (error) {
            next(error)
        }
    },

    async postCourse (req, res, next) {
        try {
            const { id } = req.user
            const {
                skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
                max_participants: maxParticipants, meeting_url: meetingUrl
            } = req.body
            // 400: 欄位驗證失敗時觸發：任
            // 一欄位缺漏或為空字串、max_participants 不是數字型別的 0 以上整數、meeting_url 不是 https 開頭。
            if (!isValidString(skillId) ||
            !isValidString(name) ||
            !isValidString(description) ||
            !isValidString(startAt) ||
            !isValidString(endAt) ||
            !isValidInteger(maxParticipants) ||
            !isValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const courseRepo = dataSource.getRepository('Course')
            const newCourse = courseRepo.create({
                user_id: id,
                skill_id: skillId,
                name,
                description,
                start_at: startAt,
                end_at: endAt,
                max_participants: maxParticipants,
                meeting_url: meetingUrl
            })
            const savedCourse = await courseRepo.save(newCourse)
            const course = await courseRepo.findOne({
                where: { id: savedCourse.id }
            })
            res.status(201).json({
                status: 'success',
                data: { course }
            })
        } catch (error) {
            next(error)
        }
    },
  
    async getCoachCourseDetail (req, res, next) {
        try {
            const { id } = req.user
            const { courseId } = req.params
            if (!isValidString(courseId)) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const course = await dataSource.getRepository('Course').findOne({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    start_at: true,
                    end_at: true,
                    max_participants: true,
                    meeting_url: true,
                    skill: { id: true, name: true }
                },
                where: { id: courseId, user_id: id },
                relations: { skill: true }
            })
            if (!course) {
                return next(appError(400, '課程不存在'))
            }
            res.status(200).json({
                status: 'success',
                data: {
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    start_at: course.start_at,
                    end_at: course.end_at,
                    max_participants: course.max_participants,
                    skill_name: course.skill.name,
                    skill_id: course.skill.id,
                    meeting_url: course.meeting_url
                }
            })
        } catch (error) {
            next(error)
        }
    },
  
    async putCoachCourseDetail (req, res, next) {
        try {
            const { id } = req.user
            const { courseId } = req.params
            const {
                skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
                max_participants: maxParticipants, meeting_url: meetingUrl
            } = req.body
            if (!isValidString(courseId) ||
                !isValidString(skillId) ||
                !isValidString(name) ||
                !isValidString(description) ||
                !isValidString(startAt) ||
                !isValidString(endAt) ||
                !isValidInteger(maxParticipants) ||
                !isValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const courseRepo = dataSource.getRepository('Course')
            const existingCourse = await courseRepo.findOne({
                where: { id: courseId, user_id: id }
            })
            if (!existingCourse) {
                return next(appError(400, '課程不存在'))
            }
            const updateCourse = await courseRepo.update({
                id: courseId
            }, {
                skill_id: skillId,
                name,
                description,
                start_at: startAt,
                end_at: endAt,
                max_participants: maxParticipants,
                meeting_url: meetingUrl
            })
            if (updateCourse.affected === 0) {
              return next(appError(400, '更新課程失敗'))
            }
            const savedCourse = await courseRepo.findOne({
              where: { id: courseId }
            })
            res.status(200).json({
                status: 'success',
                data: { course: savedCourse }
            })
        } catch (error) {
            next(error)
        }
    },

    // 教練後台「營收報表」頁呼叫。需要登入，且登入者必須已經是教練。
    
    // ⚠️ 這支有三條「不寫出來你一定會猜錯」的隱形語意，請照著做：
    // 1. 算哪一個月，看「報名建立時間」：一筆報名算進哪個月，依據是它「被建立的時間」，不是課程的上課時間。8 月報名 9 月的課，算 8 月的營收。已取消的報名不計。
    // 2. 年份固定是伺服器的「當年」：?month= 收英文小寫月份名（january、february、…、december），不是數字、也不是 YYYY-MM。查 june 就是查「今年 6 月」，不支援跨年查詢。
    // 3. 營收公式（floor 放在最後一步）：
    //    3.1 單堂均價 = 全部購買方案的 Σprice ÷ Σcredit_amount（所有方案一起算，不是只算某一包）
    //    3.2 營收 revenue = floor(該月未取消報名筆數 × 單堂均價)——先乘再無條件捨去，不要先把均價捨去再乘。
    
    // 可以手算驗證的範例：系統裡共 2 個方案——「10 堂 1000 元」＋「3 堂 1000 元」→ 單堂均價 = (1000+1000) ÷ (10+3) = 2000 ÷ 13 ≈ 153.846…；該月未取消報名 2 筆 → revenue = floor(2 × 153.846…) = floor(307.69…) = 307。

    // 回傳欄位語意：
    // * data.total.revenue：上面公式算出的整數營收
    // * data.total.participants：該月不重複的報名學員數（同一人報多堂只算 1 人）
    // * data.total.course_count：該月未取消的報名筆數（⚠️ 欄位名雖然叫 course_count，實際語意是報名數，跟 revenue 公式裡乘的數字是同一個）
    // * 教練還沒開過任何課 → 直接回三個 0（200 成功，不是錯誤）

    // 驗收口徑：狀態碼數字供參考，驗收只看 2xx／4xx 與 body 的 status 欄位。
    async getCoachRevenue (req, res, next) {
        try {
            // Name     Description
            // month    ⚠️ 英文小寫月份名（january～december），不是數字、不是 YYYY-MM。年份固定為伺服器當年。
            // (string) Available values : january, february, march, april, may, june, july, august, september, october, november, december
            // Example : june

            // Code	Description
            // 400  month 沒帶、或不是合法的英文小寫月份名（例如送了 6、June、2026-06）時觸發。
            const { id } = req.user
            const { month } = req.query
            if (!Object.prototype.hasOwnProperty.call(monthMap, month)) {
                return next(appError(400, '欄位未填寫正確'))
            }
            const courseRepo = dataSource.getRepository('Course')
            const courses = await courseRepo.find({
                select: { id: true },
                where: { user_id: id }
            })
            const courseIds = courses.map(course => course.id)
            if (courseIds.length === 0) {
                // Code	Description
                // 200  成功取得該月營收統計；教練沒開過任何課時回三個 0（也是成功）
                res.status(200).json({
                    status: 'success',
                    data: {
                        total: {
                            revenue: 0,
                            participants: 0,
                            course_count: 0
                        }
                    }
                })
                return
            }
            const courseBookingRepo = dataSource.getRepository('CourseBooking')
            const year = new Date().getFullYear()
            const calculateStartAt = dayjs(`${year}-${month}-01`).startOf('month').toISOString()
            const calculateEndAt = dayjs(`${year}-${month}-01`).endOf('month').toISOString()
            const courseCount = await courseBookingRepo.createQueryBuilder('course_booking')
                .select('COUNT(*)', 'count')
                .where('course_id IN (:...ids)', { ids: courseIds })
                .andWhere('cancelled_at IS NULL')
                .andWhere('created_at >= :startDate', { startDate: calculateStartAt })
                .andWhere('created_at <= :endDate', { endDate: calculateEndAt })
                .getRawOne()
            const participants = await courseBookingRepo.createQueryBuilder('course_booking')
                .select('COUNT(DISTINCT(user_id))', 'count')
                .where('course_id IN (:...ids)', { ids: courseIds })
                .andWhere('cancelled_at IS NULL')
                .andWhere('created_at >= :startDate', { startDate: calculateStartAt })
                .andWhere('created_at <= :endDate', { endDate: calculateEndAt })
                .getRawOne()
            const totalCreditPackage = await dataSource.getRepository('CreditPackage').createQueryBuilder('credit_package')
                .select('SUM(credit_amount)', 'total_credit_amount')
                .addSelect('SUM(price)', 'total_price')
                .getRawOne()
            const perCreditPrice = totalCreditPackage.total_price / totalCreditPackage.total_credit_amount
            const totalRevenue = courseCount.count * perCreditPrice
            res.status(200).json({
                status: 'success',
                data: {
                    total: {
                        revenue: Math.floor(totalRevenue),
                        participants: parseInt(participants.count, 10),
                        course_count: parseInt(courseCount.count, 10)
                    }
                }
            })
        } catch (error) {
            next(error)
        }
    },
}

module.exports = adminController;