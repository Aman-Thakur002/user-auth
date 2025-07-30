"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
   
    await queryInterface.addConstraint("UserFcmTokens", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_userfcmtokens_userid", 
      references: {
        table: "Users",
        field: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

   
   
    await queryInterface.addConstraint("Users", {
      fields: ["role"],
      type: "foreign key",
      name: "fk_users_role",
      references: {
        table: "Roles",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

 
  },
};
