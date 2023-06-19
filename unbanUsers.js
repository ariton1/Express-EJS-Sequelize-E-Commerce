const cron = require("node-cron");

const db = require("../models");
const User = db.User;

cron.schedule("1 0 * * *", async () => {
  try {
    const users = await User.findAll({
      where: {
        is_banned: true,
        banned_until: {
          [Op.lt]: new Date(),
        },
      },
    });

    for (const user of users) {
      user.is_banned = false;
      user.banned_reason = null;
      user.banned_until = null;
      await user.save();
    }
  } catch (error) {
    console.error(error);
  }
});
