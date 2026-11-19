const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const logger = require("../utils/logger");

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      password,
      bio,
      profilePicture
    } = req.body;

    logger.debug("Register attempt", { username });

    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      const error = new Error("Username or email already exists");
      error.status = 409;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      bio,
      profilePicture
    });

    logger.info("User registered", { userId: user._id, username: user.username });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const {
      username,
      password
    } = req.body;

    logger.debug("Login attempt", { username });

    const user = await User.findOne({
      username
    });

    if (!user) {
      logger.warn("Login failed: unknown username", { username });

      const error = new Error("Invalid username or password");
      error.status = 401;
      return next(error);
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      logger.warn("Login failed: wrong password", { userId: user._id, username });

      const error = new Error("Invalid username or password");
      error.status = 401;
      return next(error);
    }

    const token = jwt.sign(
      {
        userId: user._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    logger.info("User logged in", { userId: user._id, username: user.username });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};
