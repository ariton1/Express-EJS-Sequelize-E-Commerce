"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.belongsTo(models.Subcategory, {
        foreignKey: "subcategory_id",
      });

      Product.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  Product.init(
    {
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      in_stock: DataTypes.BOOLEAN,
      ship_to: DataTypes.JSON,
      sub_products: DataTypes.JSON,
      image: DataTypes.STRING,
      reviews: DataTypes.JSON,
      unit: DataTypes.STRING,
      source: DataTypes.STRING,
      sold: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      currency: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
