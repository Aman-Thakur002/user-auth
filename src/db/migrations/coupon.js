"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Coupons", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      applicableFor: {
        type: Sequelize.ENUM("new_user", "existing_user", "all"),
        allowNull: false,
        defaultValue: "all",
      },
      discountType: {
        type: Sequelize.ENUM("percentage", "flat"),
        allowNull: false,
      },
      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      maxDiscountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      minOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      validFrom: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      validTo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      maxRedemptions: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      perUserLimit: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      stripeCouponId: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM("Active", "Inactive", "Expired"),
        allowNull: false,
        defaultValue: "Active",
      },
      createdBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      updatedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Cleanup ENUMs manually if needed
    await queryInterface.dropTable("Coupons");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Coupons_applicableFor";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Coupons_discountType";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Coupons_status";'
    );
  },
};
