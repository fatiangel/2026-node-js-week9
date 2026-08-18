const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Course",
  tableName: "courses",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    user_id: { type: "uuid", nullable: false },
    skill_id: { type: "uuid", nullable: false },
    name: { type: "varchar", length: 100, nullable: false },
    description: { type: "text", nullable: false },
    start_at: { type: "timestamptz", nullable: false },
    end_at: { type: "timestamptz", nullable: false },
    max_participants: { type: "integer", nullable: false, default: 0 },
    meeting_url: { type: "varchar", length: 2048, nullable: true },
    created_at: { type: "timestamptz", createDate: true },
    updated_at: { type: "timestamptz", updateDate: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: { name: "skill_id" },
    },
  },
});
