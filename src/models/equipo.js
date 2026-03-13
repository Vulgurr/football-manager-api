import { DataTypes } from "sequelize"; // Importamos los tipos de datos (Texto, Numero, etc)
import { sequelize } from "../BD/sequelize.js";

const Equipo = sequelize.define("Equipo", {
  // Sequelize crea automáticamente el 'id' como pk autoincremental
  // Si lo quisieras poner explicito seria:
  // id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // CAMPOS OBLIGATORIOS
  name: {
    type: DataTypes.STRING, //Es como varchar
    allowNull: false, // NOT NULL
    unique: true      // UNIQUE
  },

  creadoPor: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    defaultValue: 0   // DEFAULT 0
  },

  //CAMPOS OPCIONALES (allowNull: true es el default)
  shortName: {
    type: DataTypes.STRING
  },
  tla: {
    type: DataTypes.STRING(10) // Es el equivalente a VARCHAR(10)
    //No vale la pena preocuparse por el largo del string salvo reglas de negocio
    //Postgres lo optimiza solo,
  },
  crestUrl: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true // Opcional: Valida formato si escriben algo
    }
  },
  founded: {
    type: DataTypes.INTEGER
  },
  clubColors: {
    type: DataTypes.STRING
  },
  venue: {
    type: DataTypes.STRING
  },
  lastUpdated: {
    type: DataTypes.DATE 
  },
  area: {
    type: DataTypes.JSONB //Recorda que area es un json con id y name
  }
}, {
  // Opciones extra del modelo
  tableName: "equipos", // Forzamos que la tabla se llame 'equipos' (en minúscula)
  timestamps: false     // IMPORTANTE: Si lo dejas en true, Sequelize intentará crear 'createdAt' y 'updatedAt'
});

export default Equipo;