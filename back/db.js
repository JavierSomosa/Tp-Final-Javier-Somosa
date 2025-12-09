const { Sequelize, DataTypes } = require("sequelize");


const sequelize = new Sequelize(
    "mysql://root:1234@127.0.0.1:3306/db_app"
);

module.exports = sequelize;