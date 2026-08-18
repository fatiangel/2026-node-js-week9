// entities/CreditPurchase.js
// user_id, credit_package_id, purchased_credits, price_paid
const { EntitySchema } = require("typeorm")

module.exports = new EntitySchema({
    name: "CreditPurchase",
    tableName: "credit_purchases",
    columns: {
        id: {
            primary: true,
            type: "uuid",
            generated: "uuid",
            nullable: false,
        },
        user_id: {
            type: "uuid",
            nullable: false,
        },
        credit_package_id: {
            type: "uuid",
            nullable: false,
        },
        purchased_credits: {
            type: "integer",
            nullable: false,
        },
        price_paid: {
           type: "integer",
           nullable: false,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
            name: "created_at",
            nullable: false,
        },
        purchaseAt: {
            type: "timestamptz",
            createDate: true,
            name: "purchase_at",
            nullable: false,
        }
    },
    relations: {
        User: {
            target: "User",
            type: "many-to-one",
            joinColumn: {
                name: "user_id",
                referencedColumnName: "id",
                foreignKeyConstraintName: "credit_purchase_user_id_fk"
            }
        },
        CreditPackage: {
            target: "CreditPackage",
            type: "many-to-one",
            joinColumn: {
                name: "credit_package_id",
                referencedColumnName: "id",
                foreignKeyConstraintName: "credit_purchase_credit_package_id_fk"
            }
        }
    }
})
