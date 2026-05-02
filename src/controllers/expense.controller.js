import * as Yup from "yup";
import Expense from "../models/Expense";
import ExpenseParticipant from "../models/ExpenseParticipant";
import User from "../models/User";
import { BadRequestError, NotFoundError, ValidationError } from "../utils/ApiError";

let expenseController = {
  // Create expense and split equally among participant_ids
  create: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        amount: Yup.number().positive().required(),
        currency: Yup.string(),
        created_by: Yup.number().required(),
        date: Yup.string(),
        participant_ids: Yup.array().of(Yup.number()).min(1).required(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { name, amount, currency, created_by, date, participant_ids } = req.body;

      const payer = await User.findByPk(created_by);
      if (!payer) throw new NotFoundError("Paying user not found");

      const participants = await User.findAll({ where: { id: participant_ids } });
      if (participants.length !== participant_ids.length)
        throw new BadRequestError("One or more participant users not found");

      // Equal split: total / number of participants
      const shareAmount = parseFloat((amount / participant_ids.length).toFixed(2));

      const expense = await Expense.create({
        name,
        amount,
        currency: currency || "USD",
        created_by,
        date: date || new Date(),
      });

      await ExpenseParticipant.bulkCreate(
        participant_ids.map((userId) => ({
          expense_id: expense.id,
          user_id: userId,
          share_amount: shareAmount,
        }))
      );

      const result = await Expense.findByPk(expense.id, {
        include: [
          { model: User, as: "paidBy", attributes: ["id", "email"] },
          {
            model: ExpenseParticipant,
            as: "participants",
            include: [{ model: User, as: "user", attributes: ["id", "email"] }],
          },
        ],
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  find: async (req, res, next) => {
    try {
      const { id } = req.params;

      const expense = await Expense.findByPk(id, {
        include: [
          { model: User, as: "paidBy", attributes: ["id", "email"] },
          {
            model: ExpenseParticipant,
            as: "participants",
            include: [{ model: User, as: "user", attributes: ["id", "email"] }],
          },
        ],
      });

      if (!expense) throw new NotFoundError("Expense not found");

      return res.status(200).json(expense);
    } catch (error) {
      next(error);
    }
  },

  // Update basic fields — does not recalculate splits
  update: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string(),
        amount: Yup.number().positive(),
        currency: Yup.string(),
        date: Yup.string(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const expense = await Expense.findByPk(req.params.id);
      if (!expense) throw new NotFoundError("Expense not found");

      await expense.update(req.body);

      return res.status(200).json(expense);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const expense = await Expense.findByPk(req.params.id);
      if (!expense) throw new NotFoundError("Expense not found");

      // Remove participants first (FK constraint)
      await ExpenseParticipant.destroy({ where: { expense_id: expense.id } });
      await expense.destroy();

      return res.status(200).json({ msg: "Expense deleted" });
    } catch (error) {
      next(error);
    }
  },
};

export default expenseController;
