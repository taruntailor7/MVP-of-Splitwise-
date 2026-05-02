/**
 * Run this ONCE after schema changes that can't be handled by sync({ force: false }).
 * It drops all tables and recreates them from the current model definitions.
 *
 * Usage:  npm run reset-db
 */
import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";
import databaseConfig from "../config/database";
import fs from "fs";
import path from "path";

(async () => {
  try {
    const connection = new Sequelize(databaseConfig);

    const modelsDir = path.join(__dirname, "../models");
    const modelFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".js"));

    for (const file of modelFiles) {
      const mod = await import(`../models/${file}`);
      mod.default.init(connection);
    }

    for (const file of modelFiles) {
      const mod = await import(`../models/${file}`);
      if (mod.default.associate) mod.default.associate(connection.models);
    }

    await connection.sync({ force: true });

    console.log("✔  All tables dropped and recreated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("✖  Reset failed:", err.message);
    process.exit(1);
  }
})();
