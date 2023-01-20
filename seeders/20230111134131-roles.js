'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const roles = [
      {
        name: 'buyer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'vendor',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'moderator',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]

    await queryInterface.bulkInsert('Roles', roles)
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Roles', null, {});
  }
}; 
