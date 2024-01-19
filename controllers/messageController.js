const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const Message = db.Message;
const { Op } = require("sequelize");

exports.renderUserList = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findOne({ where: { id: userId } });
    const role = await Role.findOne({ where: { id: user.roleId } });

    const users = await User.findAll({
      attributes: ["id", "username"],
      where: {
        id: { [Op.ne]: userId },
      },
    });

    res.render("messages/list", { user, role, users });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.renderUserList = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findOne({ where: { id: userId } });
    const role = await Role.findOne({ where: { id: user.roleId } });

    const users = await User.findAll({
      attributes: ["id", "username"],
      where: {
        id: { [Op.ne]: userId },
      },
    });

    res.render("messages/list", { user, role, users });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.renderChat = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const user = await User.findByPk(userId);
    const role = await Role.findOne({ where: { id: user.roleId } });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const receiverId = req.params.receiverId;
    const receiver = await User.findByPk(receiverId);

    if (!receiver) {
      return res.status(404).send("Receiver not found");
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { user_id: userId, receiver_id: receiverId },
          { user_id: receiverId, receiver_id: userId },
        ],
      },
      include: [
        { model: User, attributes: ["username"], as: "User" },
        { model: User, attributes: ["username"], as: "Receiver" },
      ],
      order: [["createdAt", "ASC"]],
    });

    await Message.update(
      { seen: true },
      {
        where: {
          user_id: receiverId,
          receiver_id: userId,
          seen: false,
        },
      }
    );

    const lastSeenMessage = await Message.findOne({
      where: {
        user_id: userId,
        receiver_id: receiverId,
        seen: true,
      },
      order: [["createdAt", "DESC"]],
    });

    const lastSeenMessageId = lastSeenMessage ? lastSeenMessage.id : null;

    res.render("messages/chat", { user, role, receiver, messages, lastSeenMessageId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
