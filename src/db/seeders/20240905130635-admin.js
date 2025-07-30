"use strict";
import {hashPassword} from "../../utils/password-hashing";

async function hashedPassword() {
  let hash = await hashPassword("beewell@123");
  return hash;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Admin",
          email: "admin@beewell.com",
          isVerified: true,
          password: await hashedPassword(),
          phoneNumber: 9348759232,
          type: "Admin",
          role : 1,
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      {}
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
