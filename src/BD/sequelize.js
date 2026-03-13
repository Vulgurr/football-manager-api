import { Sequelize } from "sequelize";
// eslint-disable-next-line
import { __dirname } from "../config/dotenv.js";

const env = process.env.NODE_ENV || "development"; // Por defecto development

const esTesting = env === "test";

// Si estamos testeando, usamos la DB de test para no borrar la real.
const dbURI = esTesting ? process.env.DB_URI_TEST : process.env.DB_URI;

// Supabase y Render requieren SSL. Pero si lo usas en local
// (ej: postgresql://postgres:pass@localhost:5432/bd), el SSL debe apagarse.
const esLocalhost = dbURI && (dbURI.includes("localhost") || dbURI.includes("127.0.0.1"));

// Solo activamos SSL si es producción REAL (Nube) y no local
const dialectOptions = !esLocalhost
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {}; // En local (incluso simulando prod) va sin SSL

// Queremos ver logs solo en development. 
// En test ensucian la consola y en producción bajan el rendimiento.
const logging = env === "development" ? console.log : false;

export const sequelize = new Sequelize(dbURI, {
  dialect: "postgres",
  logging: logging,
  dialectOptions: dialectOptions,
});

// Función para probar si conectó (Opcional, pero útil)
export const probarConexion = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Conectado a PostgreSQL en entorno: ${env.toUpperCase()}`);
  } catch (error) {
    console.error("Error de conexión:", error);
  }
};
