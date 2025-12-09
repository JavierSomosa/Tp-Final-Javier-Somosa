const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const VentaProducto = sequelize.define(
  "VentaProducto",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ventaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "ventas_productos",
    timestamps: false,
  }
);

module.exports = VentaProducto;


