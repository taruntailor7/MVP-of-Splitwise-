import Sequelize, { Model } from "sequelize";
import bcrypt from "bcryptjs";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        default_currency: { type: Sequelize.STRING, defaultValue: "USD" },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: true,
      }
    );

    this.addHook("beforeSave", async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  static associate(models) {
    this.belongsToMany(models.Address, {
      through: "user_addresses",
      foreignKey: "userId",
    });

    this.hasMany(models.Expense, { foreignKey: "created_by", as: "createdExpenses" });
    this.hasMany(models.ExpenseParticipant, { foreignKey: "user_id", as: "participations" });
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toSafeJSON() {
    const { id, name, email, default_currency, createdAt, updatedAt } = this;
    return { id, name, email, default_currency, createdAt, updatedAt };
  }
}

export default User;
