import JwtService from "../services/jwt.service";
import { BadTokenError } from "../utils/ApiError";

// Protect a route: extract and verify the Bearer token from the Authorization header
const authMiddleware = async (req, res, next) => {
  try {
    if (process.env.SERVER_JWT === "false") return next();

    const token = JwtService.jwtGetToken(req);
    const decoded = JwtService.jwtVerify(token);

    // Attach decoded userId to the request for use in downstream handlers
    req.userId = decoded;

    return next();
  } catch (error) {
    next(new BadTokenError());
  }
};

export default authMiddleware;
