"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        id: "6da769a6-28d5-424c-9690-63b359f8a6af",
        username: "ariton",
        password: "$2a$10$KGvdIQ3aU5CDP4WiGdOFIOBoEmmsk28Qz2pOrq0r7/XTVPkQhLL9y",
        twofactor_enabled: true,
        twofactor_secret:
          "U2FsdGVkX1+Oc72YLsAF3hzfyYApPig9IMwmlRuutfp5R0FY1m/dPgEe4axhW9vs6ww+LLBZCP9tAMSXIjfSEA==",
        phrase: "davster",
        mnemonic:
          "U2FsdGVkX1+2Lwc0bBc41Md38R2CNJWp7KPVWdXVGwMNXp12pB0w0OPdBBx6yDRWUiJ6Nzen0uMDQHOu50Re/myIszuHaDjhbBITAr6nzqzK3TV/LRElGSbeHnxLUvwvMDo8T4gOdgs6h+mU9Q16OSzWczwHnI0fMb7eAt+P/7WfqoSPydGUvvnrKHRI+WF7U9VVeFNCvO/JE1DdVNa/azQmPqiHpTBmkSOe9LFnlgU=",
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
