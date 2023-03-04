"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class VendorApplication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      VendorApplication.belongsTo(models.User, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  VendorApplication.init(
    {
      reason: DataTypes.STRING,
      products: DataTypes.STRING,
      countries: DataTypes.STRING,
      other_markets: DataTypes.STRING,
      links: DataTypes.STRING,
      status: DataTypes.STRING,
      rejection_reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "VendorApplication",
    }
  );
  return VendorApplication;
};
