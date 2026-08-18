// entities/Course.js
// user_id, skill_id, name, start_at, end_at, max_participants
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "Course",
    tableName: "courses",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        user_id: {
            type: "uuid",
            nullable: false,
        },
        skill_id: {
            type: "uuid",
            nullable: false,
        },
        // name varchar(100) 必填
        name: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        // description text 必填
        description: {
            type: "text",
            nullable: false,
        },
        // start_at timestamp 必填
        start_at: {
            type: "timestamptz",
            nullable: false,
        },
        // end_at timestamp 必填
        end_at: {
            type: "timestamptz",
            nullable: false,
        },
        // max_participants integer 必填
        max_participants: {
            type: "integer",
            nullable: false,
        },
        // ... 原本的欄位保持不動 ...
        meeting_url: {
            type: "varchar",
            length: 2048,
            nullable: true, // ← 已有資料，必須允許為空
        },
        // created_at、updated_at（建立／更新時間，由系統自動帶入）
        createdAt: {
            type: "timestamptz",
            createDate: true,
            name: "created_at",
        },
        updatedAt: {
            type: "timestamptz",
            updateDate: true,
            name: "updated_at",
        }
    },
      relations: {
        //user_id → USER（開課教練）
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: {
                name: "user_id",
                referencedColumnName: "id",
                foreignKeyConstraintName: 'courses_user_id_fk',
            }
        },
        // skill_id → SKILL（課程技能）
        skill: {
            type: "many-to-one",
            target: "Skill",
            joinColumn: {
                name: "skill_id",
                referencedColumnName: "id",
                foreignKeyConstraintName: 'courses_skill_id_fk',
            }
        },
    }
});
