// entities/Coach.js
const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
    name: "Coach",
    tableName: "coaches",
    columns: {
        id: {
            primary: true,
            type: "uuid",
            generated: "uuid"
        },
        user_id: {
            type: "uuid",
            unique: true,
            nullable: false,
        },
        experience_years: {
            type: "integer",
            nullable: false,
            default: 0,
        },
        description: {
            type: "text",
            nullable: true,
        },
        profile_image_url: {
            type: "varchar",
            length: 2048,
            nullable: true,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
            name: "created_at",
            nullable: false,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
            name: "updated_at",
            nullable: true,
        }
    },
    relations: {
        user: {
            type: "one-to-one",
            target: "User", // ← 對應 Entity 的 name，不是 tableName
            joinColumn: {
                name: "user_id", // ← 對應本表的欄位名
                referencedColumnName: "id",
                foreignKeyConstraintName: "coach_user_id_fk"
            }, 
        },
        CoachLinkSkill: {
            target: "CoachLinkSkill",
            type: "one-to-many",
            inverseSide: "Coach"
        }
    },
});
