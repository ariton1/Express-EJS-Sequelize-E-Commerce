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
      Subcategory.hasMany(models.Product, {
        foreignKey: "subcategory_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Subcategory.belongsTo(models.Category, {
        foreignKey: "category_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Subcategory.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Subcategory",
    }
  );
  return Subcategory;
};
