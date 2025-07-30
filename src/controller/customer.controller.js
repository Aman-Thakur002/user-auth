const { sequelize, Users, Roles } = require("../models");
import { Op } from "sequelize";
import { isMatch } from "../utils/password-hashing";
import { createAccesstoken } from "../utils/jwt";
import { SendOtp } from "../utils/send-otp";

//============<< Customer Sign Up Api >>=============//
export async function CustomerSignUp(req, res, next) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ status: "error", message: "Email and password are required." });
    }

    email = email.toLowerCase().trim();
    password = password.trim();

    req.body.email = email;
    req.body.password = password;
    req.body.type = "Customer";

    let role = await Roles.findOne({
      where: { name: "Customer" }
    });

    req.body.role = role ? role.id : null;

    let createdUser;
    const existingUser = await Users.findOne({
      where: { email },
      paranoid: false,
    });

    if (existingUser) {
      if (!existingUser.deletedAt) {
        // Active user already exists
        return res.status(400).send({
          status: "error",
          message: "Email already in use.",
        });
      }

      // Restore soft-deleted user and update data
      await existingUser.restore();
      await existingUser.update({ ...req.body });
      createdUser = existingUser;
    } else {
      // Create new user
      createdUser = await Users.create(req.body);
    }

    await SendOtp({
      email: createdUser.email,
      name: createdUser.name,
      isRegistration: true,
    });
    createdUser.password = undefined; // Remove password from response
    createdUser.otp = undefined; // Remove OTP from response
    createdUser.magicLinkToken = undefined; // Remove magic link token from response

    return res.status(201).send({
      status: "success",
      message: "Profile created successfully. Please verify your email.",
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
}

//============<< Customer Login Api >>=============//
export async function logInCustomer(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.missingCredentials"),
      });
    }

    const userData = await Users.findOne({
      where: {
        email,
        type: { [Op.eq]: "Customer" },
      },
      include: [
        {
          model: Roles,
          as : "roleDetails",
          attributes: ["id", "name", "accessId"],
        },
      ],
    });

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser"),
      });
    }

    const matched = await isMatch(
      password,
      userData.password
    );

    if (!matched) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.wrongPassword"),
      });
    }

    if (!userData.isVerified) {
      SendOtp({
        email: userData.email,
        name: userData.name,
        isOtp: true,
      });

      return res.status(401).send({
        status: "error",
        statusType: "notVerified",
        message: res.__("users.mailNotVerified"),
      });
    }

    await userData.update({
      lastLogin: new Date(),
    })

    userData.password = undefined; // Remove password from response
    userData.otp = undefined; // Remove OTP from response
    userData.magicLinkToken = undefined; // Remove magic link token from response
    return res.status(200).send({
      status: "success",
      message: res.__("users.login"),
      accessToken: createAccesstoken(userData),
      user: userData,
    });
  } catch (error) {
    next(error);
  }
}

