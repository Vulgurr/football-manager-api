import { DataTypes } from "sequelize"; // Importamos los tipos de datos (Texto, Numero, etc)
import { sequelize } from "../BD/sequelize.js";

const Usuario = sequelize.define("Usuario", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hashPassword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, //No puede haber dos usuarios con el mismo email
    validate: {
      isEmail: true // Sequelize valida automáticamente que sea formato email
    }
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "usuario" //Justamente el default
  },
  tokenVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // Empieza en 0
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Importante: true por defecto
    allowNull: false
  },
}, {

  tableName: "usuarios", // Forzamos que la tabla se llame 'usuarios' (en minúscula)
  timestamps: false
});

export default Usuario;