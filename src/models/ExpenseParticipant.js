import Sequelize, { Model } from "sequelize";

// Each row represents one user's share in one expense
class ExpenseParticipant extends Model {
  static init(sequelize) {
    super.init(
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        expense_id: { type: Sequelize.INTEGER, allowNull: false },
        user_id: { type: Sequelize.INTEGER, allowNull: false },
        // How much this participant owes for this expense
        share_amount: { type: Sequelize.FLOAT, allowNull: false },
      },
      {
        sequelize,
        tableName: "expense_participants",
        timestamps: false,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Expense, { foreignKey: "expense_id" });
    this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  }
}

export default ExpenseParticipant;
