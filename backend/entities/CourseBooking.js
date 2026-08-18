// entities/CourseBooking.js
// user_id, course_id, cancelled_at(nullable)
const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'CourseBooking',
    tableName: 'course_bookings',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
            nullable: false
        },
        user_id: {
            type: 'uuid',
            nullable: false
        },
        course_id: {
            type: 'uuid',
            nullable: false
        },
        createdAt: {
            type: 'timestamptz',
            createDate: true,
            name: 'created_at',
            nullable: false
        },
        cancelledAt: {
            type: 'timestamptz',
            name: 'cancelled_at',
            nullable: true
        },
        bookingAt: {
            type: 'timestamptz',
            createDate: true,
            name: 'booking_at',
            nullable: false
        },
        joinAt: {
            type: 'timestamptz',
            name: 'join_at',
            nullable: true
        },
        leaveAt: {
            type: 'timestamptz',
            name: 'leave_at',
            nullable: true
        },
        cancellationReason: {
            type: 'varchar',
            name: 'cancellation_reason',
            length: 255,
            nullable: true
        }
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'course_booking_user_id_fk'
            }
        },
        course: {
            target: 'Course',
            type: 'many-to-one',
            joinColumn: {
                name: 'course_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'course_booking_course_id_fk'
            }
        }
    }
})
