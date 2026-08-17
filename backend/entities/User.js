// entities/User.js
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        // name varchar(50) 必填
        name: {
            type: "varchar",
            length: 50,
            nullable: false,
        },
        // email varchar(320) 必填且唯一
        email: {
            type: "varchar",
            length: 320,
            unique: true,
        },
        // TODO: password varchar(255) 必填
        password: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        // role varchar(20) 必填
        role: {
            type: "varchar",
            length: 20,
            nullable: false,
        },
        // created_at、updated_at（建立／更新時間，由系統自動帶入）
        createdAt: {
            type: "timestamp",
            createDate: true,
            name: "created_at",
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
            name: "updated_at",
        },
    }
});
