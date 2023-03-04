"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        id: "6da769a6-28d5-424c-9690-63b359f8a6af",
        username: "ariton",
        password: "$2a$10$aTSUcAc/4fejy6uwXlUWFubd7nO9vZ9NDcQN5kYYwVHXfl1y7lbV6",
        twofactor_enabled: true,
        twofactor_secret:
          "U2FsdGVkX18wzHGtdxywgxUSLYALn8VK+h2mAVKgh1z2lwZymDPR99Sm/ANAsvRVGcQJhkfozQhsevx+eE075w==",
        phrase: "asdasd",
        mnemonic:
          "U2FsdGVkX1+zIWRW5RSBoq7PS8UnY6jNm01GljJLXoNnToB59hujCNH7n/MGoOXH3FHMalILqQpqg4n/Y/o2iqIEjS/DvzfNtr9enCgiSmldk5L79aqcFpQ371eLtxtLmPCPVDdesVGURUazFU1fOQuxF1ZKTl0kfoLvo8f4xD8+epSNbIF4ojXUTcQPsNZFegLzPx2ZHPSOS0mLKet9Bn8hsZb1mi/XvQjm7C1h7v0=",
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 4,
        mnemonic_shown: true,
      },
      {
        id: "c298e965-dd6e-4476-a873-74c87ee29ce7",
        username: "erit1",
        password: "$2a$10$DY3Z2xQs.IW7Gd.rzwM0aOLWexKH1j.KuS8nmudPan8Y0plHyB2uK",
        twofactor_enabled: true,
        twofactor_secret:
          "U2FsdGVkX18bIHL60GLMfZsHPAoiFXHI0HsLSOJddjH053EJw5YLNXZB7iRNHAp9hG6EvIOSf5UV6CfsvNMbWQ==",
        phrase: "fdsfdf",
        mnemonic:
          "U2FsdGVkX18h/3YNvIlTDhklZU5kHxp5Dxc+GlkNXe48cX6putrY+aZR558s3twXZkEwgsJNkYuYMXakh4Hrg/w5f7uIW5BdC2S+HaeWnc2a05LoL/RdiUKHx1BUPwtRj7FQlNdEq+BeE/5ux569WWa7Wr7f004glP1RoFtau5qjXP/wz9ErspfNnZv509pa2mtKZkv0iK1SsXqeJtPJHg==",
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        mnemonic_shown: true,
      },
    ];

    await queryInterface.bulkInsert("Users", users);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
