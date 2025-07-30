"use strict";
const { Model } = require("sequelize");
import {hashPassword} from "../utils/password-hashing";

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate({ Roles }) {
      this.hasOne(Roles, {
        foreignKey: "id",
        sourceKey: "role",
        as : "roleDetails",
      });
    }
  }

  Users.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
      isVerified : DataTypes.BOOLEAN,
      type: DataTypes.STRING,
      picture: DataTypes.STRING,
      role: DataTypes.STRING,
      status: DataTypes.STRING,
      otp: DataTypes.STRING,
      magicLinkToken: DataTypes.TEXT,
      otpExpire: DataTypes.DATE,
      magicLinkTokenExpire: DataTypes.DATE,
      accessToken: DataTypes.STRING,
      dob: DataTypes.DATE,
      lastLogin: DataTypes.DATE,
      createdAt: DataTypes.NOW,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Users",
      paranoid: true,
    }
  );

  Users.beforeCreate(async (user, options) => {
    if (user.password) {
      const hashedPassword = await hashPassword(user.password);
      user.password = hashedPassword;
    }
    user.createdAt = new Date();
  });

  Users.beforeUpdate(async (user, options) => {
    if (user.changed("password")) {
      const hashedPassword = await hashPassword(user.password);
      user.password = hashedPassword;
    }
    user.updatedAt = new Date();
  });

  return Users;
};
