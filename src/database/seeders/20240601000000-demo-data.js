"use strict";
const bcrypt = require("bcryptjs");

/*
 * Seed: Demo Data
 * ───────────────
 * Creates 3 users (Alice, Bob, Carol) and 3 expenses from a shared trip.
 *
 * Expense breakdown:
 *   1. Alice pays $90 for Dinner — split 3 ways ($30 each)
 *   2. Bob   pays $60 for Taxi   — split 2 ways with Carol ($30 each)
 *   3. Carol pays $45 for Groceries — split 3 ways ($15 each)
 *
 * Expected balances:
 *   Alice:  +90 - 30 - 15 = +45  (creditor)
 *   Bob:    +60 - 30 - 30 - 15 = -15  (debtor)
 *   Carol:  +45 - 30 - 30 - 15 = -30  (debtor)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Insert users
    await queryInterface.bulkInsert("users", [
      { id: 1, email: "alice@example.com", password: hashedPassword, default_currency: "USD", createdAt: now, updatedAt: now },
      { id: 2, email: "bob@example.com",   password: hashedPassword, default_currency: "USD", createdAt: now, updatedAt: now },
      { id: 3, email: "carol@example.com", password: hashedPassword, default_currency: "USD", createdAt: now, updatedAt: now },
    ]);

    // Insert expenses
    await queryInterface.bulkInsert("expenses", [
      { id: 1, name: "Dinner",    amount: 90, currency: "USD", created_by: 1, date: "2024-06-01", createdAt: now, updatedAt: now },
      { id: 2, name: "Taxi",      amount: 60, currency: "USD", created_by: 2, date: "2024-06-02", createdAt: now, updatedAt: now },
      { id: 3, name: "Groceries", amount: 45, currency: "USD", created_by: 3, date: "2024-06-03", createdAt: now, updatedAt: now },
    ]);

    // Insert participants (equal splits)
    await queryInterface.bulkInsert("expense_participants", [
      // Dinner: split 3 ways ($30 each)
      { expense_id: 1, user_id: 1, share_amount: 30 },
      { expense_id: 1, user_id: 2, share_amount: 30 },
      { expense_id: 1, user_id: 3, share_amount: 30 },
      // Taxi: split 2 ways ($30 each)
      { expense_id: 2, user_id: 2, share_amount: 30 },
      { expense_id: 2, user_id: 3, share_amount: 30 },
      // Groceries: split 3 ways ($15 each)
      { expense_id: 3, user_id: 1, share_amount: 15 },
      { expense_id: 3, user_id: 2, share_amount: 15 },
      { expense_id: 3, user_id: 3, share_amount: 15 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("expense_participants", null, {});
    await queryInterface.bulkDelete("expenses", null, {});
    await queryInterface.bulkDelete("users", null, {});
  },
};
