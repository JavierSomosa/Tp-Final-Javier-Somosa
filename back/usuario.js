
const sequelize=require("./db");
const { DataTypes } = require("sequelize");


const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
  },
  {
    tableName: "usuarios",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);

module.exports=Usuario;