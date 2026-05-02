import Expense from "../models/Expense";
import ExpenseParticipant from "../models/ExpenseParticipant";
import User from "../models/User";

/*
 * Balance Calculation Logic
 * ─────────────────────────
 * For every expense:
 *   - CREDIT the payer the full amount (+amount)
 *   - DEBIT each participant their share (-share_amount)
 *
 * Final net balance per user:
 *   positive → others owe this user
 *   negative → this user owes others
 *   zero     → settled up
 */
let balanceController = {
  get: async (req, res, next) => {
    try {
      const balanceMap = {};

      function addToBalance(userId, amount) {
        if (!balanceMap[userId]) balanceMap[userId] = 0;
        balanceMap[userId] += amount;
      }

      // Step 1: Load all expenses with their participant rows
      const expenses = await Expense.findAll({
        include: [{ model: ExpenseParticipant, as: "participants" }],
      });

      // Step 2: Credit the payer, debit each participant
      for (const expense of expenses) {
        addToBalance(expense.created_by, expense.amount);
        for (const participant of expense.participants) {
          addToBalance(participant.user_id, -participant.share_amount);
        }
      }

      // Step 3: Fetch user emails for a human-readable response
      const userIds = Object.keys(balanceMap).map(Number);
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ["id", "email"],
      });

      const emailMap = {};
      for (const user of users) emailMap[user.id] = user.email;

      // Step 4: Build final array with balances rounded to 2 decimal places
      const balances = userIds.map((userId) => ({
        userId,
        email: emailMap[userId] || "Unknown",
        balance: parseFloat(balanceMap[userId].toFixed(2)),
      }));

      return res.status(200).json(balances);
    } catch (error) {
      next(error);
    }
  },
};

export default balanceController;
