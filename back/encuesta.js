const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Encuesta = sequelize.define(
  "Encuesta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true }
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recomendar: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 10 }
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "encuestas",
    timestamps: true,
    updatedAt: false
  }
);

module.exports = Encuesta;