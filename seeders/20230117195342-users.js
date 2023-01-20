'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const users = [
      {
        id: '6da769a6-28d5-424c-9690-63b359f8a6af',
        username: 'ariton',
        password: '$2a$10$aTSUcAc/4fejy6uwXlUWFubd7nO9vZ9NDcQN5kYYwVHXfl1y7lbV6',
        twofactor_enabled: true,
        twofactor_secret: 'U2FsdGVkX18wzHGtdxywgxUSLYALn8VK+h2mAVKgh1z2lwZymDPR99Sm/ANAsvRVGcQJhkfozQhsevx+eE075w==',
        phrase: 'asdasd',
        mnemonic: 'U2FsdGVkX1+zIWRW5RSBoq7PS8UnY6jNm01GljJLXoNnToB59hujCNH7n/MGoOXH3FHMalILqQpqg4n/Y/o2iqIEjS/DvzfNtr9enCgiSmldk5L79aqcFpQ371eLtxtLmPCPVDdesVGURUazFU1fOQuxF1ZKTl0kfoLvo8f4xD8+epSNbIF4ojXUTcQPsNZFegLzPx2ZHPSOS0mLKet9Bn8hsZb1mi/XvQjm7C1h7v0=',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 4,
        mnemonic_shown: true
      },
    ]

    await queryInterface.bulkInsert('Users', users);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
