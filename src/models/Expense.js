import Sequelize, { Model } from "sequelize";

class Expense extends Model {
  static init(sequelize) {
    super.init(
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        amount: { type: Sequelize.FLOAT, allowNull: false },
        currency: { type: Sequelize.STRING, defaultValue: "USD" },
        // The user who paid for this expense
        created_by: { type: Sequelize.INTEGER, allowNull: false },
        date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      },
      {
        sequelize,
        tableName: "expenses",
        timestamps: true,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "created_by", as: "paidBy" });
    this.hasMany(models.ExpenseParticipant, { foreignKey: "expense_id", as: "participants" });
  }
}

export default Expense;
