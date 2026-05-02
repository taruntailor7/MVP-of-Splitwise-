import * as Yup from "yup";
import User from "../models/User";
import JwtService from "../services/jwt.service";
import {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "../utils/ApiError";

let loginController = {
  // Register a new account
  register: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string(),
        email: Yup.string().email().required(),
        password: Yup.string().required().min(6),
        default_currency: Yup.string(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { email } = req.body;

      const userExists = await User.findOne({ where: { email } });
      if (userExists) throw new BadRequestError("Email already in use");

      const user = await User.create(req.body);

      return res.status(201).json(user.toSafeJSON());
    } catch (error) {
      next(error);
    }
  },

  // Login with email + password, returns JWT token
  login: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        email: Yup.string().email().required(),
        password: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      let { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) throw new BadRequestError("User not found");

      if (!(await user.checkPassword(password))) throw new UnauthorizedError();

      const token = JwtService.jwtSign(user.id);

      return res.status(200).json({ user: user.toSafeJSON(), token });
    } catch (error) {
      next(error);
    }
  },

  // Logout: blacklist the current token
  logout: async (req, res, next) => {
    try {
      JwtService.jwtBlacklistToken(JwtService.jwtGetToken(req));
      res.status(200).json({ msg: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default loginController;
