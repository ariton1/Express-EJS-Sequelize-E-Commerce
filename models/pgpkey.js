"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PGPKey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PGPKey.belongsTo(models.User, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  PGPKey.init(
    {
      key: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "PGPKey",
    }
  );
  return PGPKey;
};
