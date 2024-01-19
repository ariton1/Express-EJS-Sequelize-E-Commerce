"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: "roleId",
        as: "role",
      });

      User.hasOne(models.PGPKey, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.VendorApplication, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.Product, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.Message, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        as: "Messages",
      });
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      twofactor_enabled: DataTypes.BOOLEAN,
      twofactor_secret: DataTypes.STRING,
      phrase: DataTypes.STRING,
      mnemonic: DataTypes.STRING,
      mnemonic_shown: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      banned_reason: {
        type: DataTypes.STRING,
      },
      banned_until: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
