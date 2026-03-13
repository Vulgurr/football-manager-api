
import { cargaDesdeJSON } from "./services/managerDatosSequelize.js";
import { resetearTablaUsuarios, crearAdmin } from "./services/managerLoginSequelize.js";
import { sequelize } from "./BD/sequelize.js";
import path from "path";
const PUERTO = process.env.PORT;
import app from "./app.js";


let server;
sequelize.sync({
  force: false,
  alter: process.env.NODE_ENV === "development" // alter true solo en dev ayuda
})
  .then(() => {
    console.log("Tablas sincronizadas con PostgreSQL");
    server = app.listen(PUERTO, () => {
      
      const rutaJSON = path.resolve("data", "equipos.json");

      console.log(`Escuchando en el puerto ${PUERTO}`);
      cargaDesdeJSON(rutaJSON);
      //Esto carga el archivo "./data/equipos.json en la bd"
      resetearTablaUsuarios();
      crearAdmin();
    });
  })
  .catch((error) => {
    console.error("Error al sincronizar base de datos:", error);

  });


//!Ahora el listen está asignado a una variable
const cerrarServidor = async () => {
  console.log("\nRecibiendo señal de cierre (SIGINT o SIGTERM)");

  try {
    // La propiedad .open nos dice si la conexión sigue viva
    console.log("Cerrando base de datos en Sequelize...");
    await sequelize.close();
    console.log("Base de datos cerrada correctamente.");

  } catch (err) {
    // Si hay un error como una consulta pendiente, salta acá
    console.error("Error critico al cerrar la BD:", err.message);
  }

  // Cierre del Servidor HTTP
  console.log("Cerrando servidor HTTP...");
  server.close(() => {
    console.log("Servidor HTTP cerrado.");

    // Esperamos 500ms para que los logs se impriman antes de matar el proceso.
    setTimeout(() => {
      process.exit(0);
    }, 500);
  });

  // Si server.close se cuelga, forzamos la salida en 2 segundos
  setTimeout(() => {
    console.error("Forzando cierre (Timeout)...");
    process.exit(1);
  }, 2000);

};

// Escuchamos el evento SIGINT (Ctrl + C en la terminal)
process.on("SIGINT", cerrarServidor);

//Escuchamos SIGTERM 
process.on("SIGTERM", cerrarServidor);
