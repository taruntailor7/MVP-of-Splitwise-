import { IsApiError } from "../utils/ApiError";

const currentEnv = process.env.NODE_ENV || "development";

// Global error handler — must have 4 params for Express to treat it as error middleware
export default (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  // Known ApiError (NotFoundError, BadRequestError, etc.) — use its status code
  if (IsApiError(err)) return res.status(err.statusCode).json({ error: err.message });

  // Sequelize validation (e.g. invalid email format)
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join(", ") });
  }

  // Sequelize unique constraint (e.g. duplicate email)
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "A record with that value already exists" });
  }

  // Unexpected errors
  if (currentEnv === "development") {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
};
