'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VendorApplications', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false
      },
      products: {
        type: Sequelize.STRING,
        allowNull: false
      },
      countries: {
        type: Sequelize.STRING,
        allowNull: false
      },
      other_markets: {
        type: Sequelize.STRING,
        allowNull: false
      },
      links: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM,
        values: ['pending', 'approved', 'rejected'],
        defaultValue: 'pending'
      },
      rejectionReason: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.UUID,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('VendorApplications');
  }
};