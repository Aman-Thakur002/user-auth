"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Roles extends Model {
    static associate() {
   
    }
  }

  Roles.init(
    {
      name: DataTypes.STRING,
      accessId: DataTypes.JSON,
      status: {
        type: DataTypes.STRING,
        defaultValue: "Active", 
      },      
      createdAt: DataTypes.NOW,
      updatedAt:DataTypes.DATE,
    },
    
    {
        sequelize,
        modelName: "Roles",
        paranoid: true,
    }
  );

  Roles.beforeCreate(async (role, options) => {
    role.createdAt = new Date();
  });
  Roles.beforeUpdate(async (role, options) => {
    role.updatedAt = new Date();
  });

  return Roles;
};
