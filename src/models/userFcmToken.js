"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserFcmTokens extends Model {
    static associate() {}
  }

  UserFcmTokens.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fcmToken: DataTypes.STRING,
      deviceType: DataTypes.ENUM("Android", "iOS", "Web"),
      status: DataTypes.STRING,
      createdAt: DataTypes.NOW,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "UserFcmTokens",
    }
  );
  return UserFcmTokens;
};
