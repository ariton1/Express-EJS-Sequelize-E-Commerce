'use strict';

const { BOOLEAN } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      twofactor_enabled: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      twofactor_secret: {
        type: Sequelize.STRING,
      },
      phrase: {
        type: Sequelize.STRING,
      },
      mnemonic: {
        type: Sequelize.STRING,
      },
      pgp_key: {
        type: Sequelize.TEXT,
        unique: true,
      },
      pgp_verified: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};