// entities/CreditPackage.js
// name(unique), credit_amount(int), price(int)
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "CreditPackage",
    tableName: "credit_packages",
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
            nullable: false,
        },
        name: {
            type: "varchar",
            length: 255,
            unique: true,
        },
        credit_amount: {
            type: "integer",
            nullable: false,
        },
        price: {
            type: "integer",
            nullable: false,
        },
        createdAt: {
            type: 'timestamptz',
            createDate: true,
            name: 'created_at',
            nullable: false,
        },
        updatedAt: {
            type: "timestamptz",
            updateDate: true,
            name: 'updated_at',
            nullable: false,
        }
    }
});