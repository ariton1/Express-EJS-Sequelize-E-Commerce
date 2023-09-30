"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Subcategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Subcategory.belongsTo(models.Role, {
        foreignKey: "category_id",
        as: "category",
      });
    }
  }
  Subcategory.init(
    {
      name: DataTypes.STRING,
      category_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Subcategory",
    }
  );
  return Subcategory;
};
