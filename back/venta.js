const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Venta = sequelize.define(
  "Venta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clienteNombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "ventas",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);

module.exports = Venta;


