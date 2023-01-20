'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {    
      User.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role',
      })

      User.hasOne(models.PGPKey, {
        foreignKey: 'user_id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    twofactor_enabled: DataTypes.BOOLEAN,
    twofactor_secret: DataTypes.STRING,
    phrase: DataTypes.STRING,
    mnemonic: DataTypes.STRING,
    mnemonic_shown: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};