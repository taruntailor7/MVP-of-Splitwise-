require("dotenv").config();

// This file is used both by the app (via sequelize.service.js) and
// by the Sequelize CLI (for migrations/seeders via .sequelizerc)
module.exports = {
  dialect: process.env.DB_DIALECT || "postgres",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  define: {
    timestamps: true,
  },
  // Neon (and most hosted Postgres) requires SSL
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};
