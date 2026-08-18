const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CreditPurchase",
  tableName: "credit_purchases",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    user_id: { type: "uuid", nullable: false },
    credit_package_id: { type: "uuid", nullable: false },
    purchased_credits: { type: "integer", nullable: false },
    price_paid: { type: "integer", nullable: false },
    purchase_at: { type: "timestamptz", createDate: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
    },
    creditPackage: {
      type: "many-to-one",
      target: "CreditPackage",
      joinColumn: { name: "credit_package_id" },
    },
  },
});
