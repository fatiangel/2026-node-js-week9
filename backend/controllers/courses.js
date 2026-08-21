const { IsNull, MoreThan, LessThanOrEqual } = require('typeorm')
const { dataSource } = require('../db/data-source')
const appError = require('../utils/appError')

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
    },

    // POST /api/courses/:courseId（需登入）：報名課程
    async postCoursesBooking(req, res, next) {
        // 報名課程（學員用 token 報名一門課，最容易踩雷）
        // 【行為備註】
        // a. 這支不需要 request body：要報名的課由網址的 courseId 決定、報名的人由 token 決定。
        // b. 錯誤檢查順序（順序也要照做，先中的先回）：
        //      ① courseId 查無此課程 → 400「ID錯誤」
        //      ② 這位使用者對這門課已有報名紀錄（包含已取消的紀錄） → 400「已經報名過此課程」
        //      ③ 剩餘堂數歸零 → 400「已無可使用堂數」
        //      ④ 這門課目前的有效報名人數已達名額上限 → 400「已達最大參加人數，無法參加」
        //    全部通過 → 建立報名紀錄，回 201、data 為 null。
        // c. ⚠️「取消過的課不能再報名」：檢查②比對報名紀錄時不排除已取消的，
        //    所以同一門課取消後再報名，會吃到「已經報名過此課程」。這是規格，不是 bug。
        // d. 剩餘堂數沒有獨立欄位：剩餘堂數 ＝ 所有方案購買的堂數加總 − 未取消的報名數，每次報名時即時算出來。
        try {
            const { courseId } = req.params;
            const courseRepo = dataSource.getRepository("Course");
            const courseBookingRepo = dataSource.getRepository("CourseBooking");
            const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");

            // ① courseId 查無此課程 → 「ID錯誤」
            const findCourse = await courseRepo.findOneBy({ id: courseId });
            if (!findCourse) {
                return next(appError(400, "ID錯誤"));
            }

            // method A:
            // const findBooking = await courseBookingRepo.findOne({
            //     where: {
            //         user_id: req.user.id,
            //         course_id: courseId,
            //     },
            //     select: {
            //         id: true,
            //         cancelledAt: true,
            //     },
            //     relations: {
            //         course: true,
            //     },
            // });

            // ② 已有此課程的報名紀錄（含已取消） → 「已經報名過此課程」
            // method B:
            const findBooking = await courseBookingRepo.findOneBy({
                user_id: req.user.id,
                course_id: courseId,
            });
            if (findBooking) {
                return next(appError(400, "已經報名過此課程"));
            }
            // ③ 剩餘堂數歸零（購買堂數加總 − 未取消報名數 ≤ 0，沒買過方案也算） → 「已無可使用堂數」
            const purchasesPoints = await creditPurchaseRepo.find({
                where: { user_id: req.user.id },
            });
            const totalPoints = purchasesPoints.reduce((sum, p) => sum + p.purchased_credits, 0);
            const usedPoints = await courseBookingRepo.count({
                where: {
                    user_id: req.user.id,
                    cancelledAt: IsNull(),
                }
            });
            if (totalPoints - usedPoints <= 0) {
                return next(appError(400, "已無可使用堂數"));
            }
            // ④ 這門課目前的有效報名人數已達名額上限 → 「已達最大參加人數，無法參加」
            const courseBookingCount = await courseBookingRepo.count({
                where: {
                    course_id: courseId,
                    cancelledAt: IsNull(),
                },
            });
            if (courseBookingCount >= findCourse.max_participants) {
                return next(appError(400, "已達最大參加人數，無法參加"));
            }

            // 報名
            await courseBookingRepo.save({
                user_id: req.user.id,
                course_id: courseId,
            });

            res.status(201).json({
                status: "success",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    },

    // Code	Description
    // 401	觸發條件：登入驗證沒過。下方是建議回應範例；驗收重點是 4xx + status: failed。 只有「請先登入」是固定錯誤訊息文字，必須完全相同。
    // 已在 isAuth()中, 處理.
    // DELETE /api/courses/:courseId（需登入）：取消報名
    async deleteCoursesBooking(req, res, next) {
        // 取消課程報名（軟刪除：紀錄保留、標記取消、堂數自動歸還）

        // 【行為備註】
        // 1. 取消＝軟刪除：報名紀錄不會被刪掉，只是在紀錄上標記「已取消」的時間。
        // 2. 堂數自動歸還：因為剩餘堂數是「購買堂數加總 − 未取消報名數」即時算出來的， 報名一取消，未取消數就少一，堂數自然回來——不需要另外把堂數「加回去」。
        // 3. ⚠️ 但取消過的課不能再報名：報名那支（POST）的重複檢查包含已取消紀錄， 因此同一門課取消後再報名，仍會回「已經報名過此課程」。請在報名檢查中保留這個限制。
        // 4. 失敗條件：找不到「這位使用者、這門課、而且還沒取消」的報名紀錄 → 400「ID錯誤」。 課程不存在、從未報名過、已經取消過——三種情況都回同一句「ID錯誤」。
        // 5. 極罕見的情況下標記取消沒成功會回 400「取消失敗」，不在驗收範圍，知道有這回事就好。
        // 6. 成功回 200、data 為 null。狀態碼供參考，驗收尺度只看 2xx／4xx ＋ status 欄位。
            try {
                const { courseId } = req.params;
                const courseBookingRepo = dataSource.getRepository("CourseBooking");

                // Code	Description
                // 400  找不到「這位使用者對這門課、尚未取消」的報名紀錄 （課程不存在／從未報名／已經取消過，三種情況都回這句）
                const findBooking = await courseBookingRepo.findOneBy({
                    user_id: req.user.id,
                    course_id: courseId,
                    cancelledAt: IsNull(),
                });
                if (!findBooking) {
                    return next(appError(400, "ID錯誤"));
                }

                findBooking.cancelledAt = new Date();
                await courseBookingRepo.save(findBooking);
                res.status(200).json({
                    status: "success",
                    data: null,
                });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = courseController
