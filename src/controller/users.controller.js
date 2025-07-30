const {
  sequelize,
  Users,
  Roles,
  UserFcmTokens,
} = require("../models");
import { Op } from "sequelize";
import { isMatch } from "../utils/password-hashing";
import { createAccesstoken } from "../utils/jwt";
import { sendMail } from "../services/send-mail";
import { SendOtp, sendMagicLink } from "../utils/send-otp";


//----------------------------------<< check user status >>-----------------------------------
export async function checkUserStatus(req, res, next) {
  try {
    const userData = await Users.findOne({
      where: { id: req.user.id },
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

    if (!userData.isVerified) {
      return res.status(200).send({
        status: "error",
        statusType: "notVerified",
        message: res.__("users.mailNotVerified"),
      });
    }


    userData.password = undefined; // Remove password from response
    userData.otp = undefined; // Remove OTP from response
    userData.accessToken = undefined // Remove accessToken from response

    return res.status(200).send({
      status: "success",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------------------------<< LogIn >>-----------------------------
export async function logIn(req, res, next) {
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
        type: { [Op.ne]: "Customer" },
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

    userData.password = undefined;
    userData.otp = undefined;
    userData.accessToken = undefined;

    return res.status(200).send({
      status: "success",
      message: res.__("users.login"),
      accessToken: createAccesstoken(userData),
      data: userData
    });
  } catch (error) {
    next(error);
  }
}

//-----------------------<< Verify OTP >>-----------------------------------
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.missingEmailOrOtp"),
      });
    }

    const userData = await Users.findOne({
      where: { email: email.trim().toLowerCase() },
      attributes: [
        "id",
        "otp",
        "name",
        "email",
        "phoneNumber",
        "role",
        "type",
        "isVerified"
      ],
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

    if (userData.otp !== otp.trim()) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.otpNotMatch"),
      });
    }

    await userData.update(
      {
        isVerified: true,
        otp: null,
      }
    );

    return res.status(200).send({
      status: "success",
      message: res.__("users.verify"),
      accessToken: createAccesstoken(userData),
      data: userData
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< change Password >>-----------------------------------
export async function changePassword(req, res, next) {
  const { newPassword, oldPassword } = req.body;
  const { id } = req.user;

  if (!newPassword) {
    return res.status(400).send({
      status: "error",
      message: res.__("users.passwordRequired"),
    });
  }

  try {
    const userData = await Users.findOne({
      where: { id },
      attributes: ["id", "name", "email", "password"],
    });

    if (!userData) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser"),
      });
    }

    let matched = await isMatch(
      oldPassword,
      userData.password
    );

    if (!matched) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.oldPassWrong"),
      });
    }
    await userData.update({ password: newPassword });
    const newInfo = {
      name: userData.name,
      email: userData.email,
      password: newPassword,
      changePassword: true,
    };

    const emailData = {
      to: userData.email,
      name: userData.name,
      subject: "Password Changed",
    };

    await sendMail(emailData, newInfo, "email-template.html");

    res.status(200).send({
      status: "success",
      message: res.__("users.changePasswordSuccess"),
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Forget Password >>-----------------------------------
export async function forgetPassword(req, res, next) {
  let { newPassword, email, otp } = req.body;

  newPassword = newPassword.trim();
  email = email.trim();

  try {
    let userData = await Users.findOne({
      where: {
        email: email,
        isVerified: true,
      },
      attributes: ["id", "otp", "name", "email", "phoneNumber"],
    });
    if (!userData) {
      return res
        .status(404)
        .send({ status: "error", message: res.__("users.noexist") });
    }
    if (userData?.otp !== otp) {
      return res
        .status(404)
        .send({ status: "error", message: res.__("users.otpNotMatch") });
    }
    if (userData.otpExpire < Math.floor(new Date().getTime() / 1000)) {
      res.status(400).send({
        status: "error",
        message: res.__("users.otpExp"),
      });
    } else {
       userData.otp = null;
       userData.otpExpire = null;
       userData.password = newPassword;
      await userData.save();
      const newInfo = {
        name: userData.name,
        email: userData.email,
        password: req.body.newPassword,
        changePassword: true,
      };

      const emailData = {
        to: userData.email,
        name: userData.name,
        subject: "Password Changed",
      };

      await sendMail(emailData, newInfo, "email-template.html");

      res.status(200).send({
        status: "success",
        message: res.__("users.passwordUpdate"),
      });
    }
  } catch (error) {
    next(error);
  }
}

//----------------------<< Create User >>-----------------------------------
export async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    req.body.type = "Staff";
    req.body.isVerified = true

    if (!role) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.roleRequired"),
      });
    }

    let roleData = await Roles.findOne({
      where: { id: role },
      attributes: ["id"],
    });

    if (!roleData) {
      return res.status(404).send({
        status: "error",
        message: res.__("users.roleNotFound"),
      });
    }
    req.body.role = roleData.id;
    req.body.email = email.trim().toLowerCase();
    let createdUser;
    let existingUser = await Users.findOne({
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

    const newInfo = {
      name: createdUser.name,
      email: createdUser.email,
      password: req.body.password,
      isRegistrationByAdmin: true,
    };

    const emailData = {
      to: createdUser.email,
      name: createdUser.name,
      subject: "Account Created",
    };

    await sendMail(emailData, newInfo, "email-template.html");

    return res.status(200).send({
      status: "success",
      message: res.__("users.created"),
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Update User >>-----------------------------------
export async function updateUser(req, res, next) {
  let userId = req.user.type === "Customer" ? req.user.id : req.params.id;
  if (req.file)
    req.body.picture = global.config.userPicturePath + req.file.filename;

  req.body.updatedBy = req.user.id;
  req.body.updatedAt = new Date();

  let dataToUpdate = {}
  if (req.body.name) dataToUpdate.name = req.body.name;
  if (req.body.phoneNumber) dataToUpdate.phoneNumber = req.body.phoneNumber;
  if (req.body.picture) dataToUpdate.picture = req.body.picture;
  if (req.body.dob) dataToUpdate.dob = req.body.dob;

  try {
    let userData = await Users.update(
      {
        ...dataToUpdate
      },
      {
        where: { id: userId },
      }
    );

    res.status(200).send({
      status: "success",
      message: res.__("users.userUpdate"),
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Update User Status >>-----------------------------------
export async function updateUserStatus(req, res, next) {
  try {
    let newUser = await Users.update(
      { status: req.body.status },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    res.status(200).send({
      status: "success",
      message: `User ${req.body.status} successfully`,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Delete User >>-----------------------------------
export async function deleteUser(req, res, next) {
  try {

    let data = await Users.destroy({
      where: {
        id: req.user.type !== "Admin" ? req.user.id : req.params.id,
        type: { [Op.ne]: ["Admin"] },
      },
    });

    if (data) {
      res.status(200).send({
        status: "success",
        message: res.__("users.deleteUser"),
        data: data,
      });
    } else {
      res.status(500).send({
        status: "error",
        message: res.__("serverError"),
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
}

//----------------------<< Get All Users >>-----------------------------------
export async function getUsers(req, res, next) {
  let query = {};
  let {userType} = req.query;
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;

    if (req.query?.page) {
      query["limit"] = limit;
      query["offset"] = (Number(req.query.page) - 1) * limit;
    }

    let order = req.query?.order ? req.query?.order : "desc";

    if (req.query?.orderBy) {
      query["order"] = [[req.query?.orderBy, order]];
    } else {
      query["order"] = [["id", order]];
    }

    query["where"] = {
      ...(userType && {type: userType}),
      type: {
        [Op.ne]: "Admin"
      }
    };

    if (req.query?.search) {
      query["where"] = {
        ...query["where"],
        [Op.or]: [
          { name: { [Op.like]: "%" + req.query?.search + "%" } },
          { email: { [Op.like]: "%" + req.query?.search + "%" } },
          { phoneNumber: { [Op.like]: "%" + req.query?.search + "%" } },
        ],
      };
      query["subQuery"] = false;
    }

    query["include"] = [
      {
        model: Roles,
        as : "roleDetails",
        attributes: ["name"],
      },
    ];

    query["attributes"] = [
      "id",
      "name",
      "email",
      "type",
      "role",
      "phoneNumber",
      "status",
      "picture",
      "dob",
    ];

    query["distinct"] = true;

    let data = await Users.findAndCountAll(query);

    res.status(200).send({
      status: "success",
      count: data.count,
      data: data.rows,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}


//----------------------<< Get User By ID >>-----------------------------------
export async function getUserById(req, res, next) {
  let query = {};

  try {
    query["where"] = { id: req.user.type === "Customer" ? req.user.id : req.params.id };

    query["include"] = [
      {
        model: Roles,
        as : "roleDetails",
        attributes: ["name"],
      },
    ];

    query["attributes"] = [
      "id",
      "name",
      "email",
      "phoneNumber",
      "role",
      "type",
      "picture",
      "status",
      "dob",
    ];

    let data = await Users.findOne(query);
    if (!data) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser"),
        data: data,
      });
    }
    res.status(200).send({
      status: "success",
      message: "",
      data,
    });
  } catch (error) {
    next(error);
  }
}

//===========================> (Send OTP) <=====================================//
export async function sendOTPFn(req, res, next) {
  try {
    const { email} = req.body;

    const user = await Users.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
      attributes: ["id", "email", "phoneNumber", "name"],
    });

    if (!user) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser"),
      });
    }

    const otpData = {
      email: user.email,
      name: user.name,
      isOtp: true,
    };

    await SendOtp(otpData);
    return res.status(200).send({
      status: "success",
      message: res.__("users.sendOtp"),
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: res.__("serverError"),
    });
  }
}


//===================================<<> Bulk Delete Api >>=========================
export async function bulkDelete(req, res) {
  try {
    let { ids } = req.body;
    Users.destroy({
      where: {
        id: ids,
        type: {
          [Op.notIn]: ["Customer", "Admin"],
        },
      },
    });

    return res.status(200).send({
      status: "success",
      message: res.__("bulk.success"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: res.__("bulk.500error"),
    });
  }
}

//========================<< Update FCM Token >>===================
export async function UpdateFcmToken(req, res) {
  try {
    const { fcmToken, deviceType } = req.body;

    if (!fcmToken) {
      return res.status(400).send({
        status: "error",
        message: res.__("Missing fcm token"),
      });
    }

    await UserFcmTokens.upsert({
      userId: req.user.id,
      fcmToken,
      deviceType,
    });

    return res.status(200).send({
      status: "success",
      message: res.__("Update.fcmToken"),
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).send({
      status: "error",
      message: error.message,
    });
  }
}
