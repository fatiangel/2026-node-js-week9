const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CourseBooking",
  tableName: "course_bookings",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    user_id: { type: "uuid", nullable: false },
    course_id: { type: "uuid", nullable: false },
    created_at: { type: "timestamptz", createDate: true },
    cancelled_at: { type: "timestamptz", nullable: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
    },
    course: {
      type: "many-to-one",
      target: "Course",
      joinColumn: { name: "course_id" },
    },
  },
});
