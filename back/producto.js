

const sequelize=require("./db");
const { DataTypes } = require("sequelize");


const Producto = sequelize.define(
  "Producto",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
   descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fechaSalida: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    image: {
        type: DataTypes.TEXT,
        allowNull:true,
    },
  },
  {
    tableName: "productos",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);

module.exports=Producto;