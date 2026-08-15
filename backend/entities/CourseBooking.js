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
        bookingAt: {
            type: 'timestamp',
            createDate: true,
            name: 'booking_at',
            nullable: false
        },
        joinAt: {
            type: 'timestamp',
            name: 'join_at',
            nullable: true
        },
        leaveAt: {
            type: 'timestamp',
            name: 'leave_at',
            nullable: true
        },
        cancelledAt: {
            type: 'timestamp',
            name: 'cancelled_at',
            nullable: true
        },
        cancellationReason: {
            type: 'varchar',
            name: 'cancellation_reason',
            length: 255,
            nullable: true
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
            name: 'created_at',
            nullable: false
        }
    },
    relations: {
        User: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'course_booking_user_id_fk'
            }
        },
        Course: {
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
