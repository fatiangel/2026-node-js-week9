// db/data-source.js
const { DataSource } = require("typeorm");
const config = require("../config/index");
const User = require("../entities/User");
const Skill = require("../entities/Skill");
const Coach = require("../entities/Coach");
const CoachLinkSkill = require("../entities/CoachLinkSkill");
const Course = require("../entities/Course");
const CourseBooking = require("../entities/CourseBooking");
const CreditPackage = require("../entities/CreditPackage");
const CreditPurchase = require("../entities/CreditPurchase");

const dataSource = new DataSource({
    type: "postgres",
    host: config.get("db.host"),
    port: Number(config.get("db.port")),
    username: config.get("db.username"),
    password: config.get("db.password"),
    database: config.get("db.database"),
    synchronize: config.get("db.synchronize"),
    ssl: config.get("db.ssl"),
    entities: [ // ... 把 8 個 Entity 都 require 進來
        User,
        Skill,
        Coach,
        CoachLinkSkill,
        Course,
        CourseBooking,
        CreditPackage,
        CreditPurchase
    ],
});

module.exports = { dataSource };
