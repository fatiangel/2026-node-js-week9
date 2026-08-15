// entities/Skill.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "Skill",
    tableName: "skills",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
            nullable: false,
        },
        // name varchar(50) 必填且唯一
        name: {
            type: "varchar",
            length: 50,
            unique: true,
            nullable: false,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
            name: "created_at",
            nullable: false,
        },
    }
});
