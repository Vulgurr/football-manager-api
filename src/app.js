// eslint-disable-next-line
import { __dirname } from "./config/dotenv.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/rutaUsuarios.js";
import equipoRoutes from "./routes/rutaEquipos.js";
import { errorHandler } from "./middleware/errorHandler.js";


import "./models/equipo.js";   // Importamos el modelo para que se registre
import "./models/usuario.js";  // Importamos el modelo para que se registre
//Van al inicio para que sean registrados y leidos, similar a la config de dotenv
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Por defecto, solo permite cosas de mi propio servidor
        defaultSrc: ["'self'"], 
        
        //imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://upload.wikimedia.org"],
        //!Esto no va porque se ocupa el front (en el index.html) de definir que URLs son válidas
        
        // Permite scripts solo de mi servidor (bloquea scripts externos maliciosos)
        scriptSrc: ["'self'"],
        
        // Permite conectar (fetch/XHR) a mi servidor
        connectSrc: ["'self'", "https://res.cloudinary.com", process.env.FRONTEND_URL],
      },
    },
    
    // RESOURCE POLICY (Permitir carga cruzada para las imágenes)
    // A veces es necesario mantener esto relajado para que el navegador 
    // no bloquee la descarga de la imagen en sí misma.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// MORGAN (Logging)
// 'dev' es un formato bonito con colores para desarrollo.
// En producción se suele usar 'combined' (formato estándar de servidores Apache/Nginx).
//Si estamos en testing, todo este logging molesta
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// RATE LIMIT
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.",
    standardHeaders: true, // Devuelve info en los headers `RateLimit-*`
    legacyHeaders: false, // Desactiva los headers `X-RateLimit-*`
});

// Aplicamos el limitador a todas las rutas
app.use(limiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Definimos las URLs que tienen permiso para hablar con el Backend
const allowedOrigins = [
  process.env.FRONTEND_URL,      // La URL de Frontend 
  "http://localhost:5173",       // Para correrlo local

];

// Configuramos CORS
app.use(cors({
  origin: (origin, callback) => {
    // Si el origen de la petición está en nuestra lista (o si no hay origen, como en Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Bloqueado por CORS:", origin);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true, // Importante para que funcionen los JWT y cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
/*Transforma el texto en un Objeto JavaScript y lo guarda en req.body*/


//!ROUTERS
app.use("/auth", authRoutes);
app.use("/equipos", equipoRoutes);
// Este captura cualquier next(error) que venga de CUALQUIER ruta de arriba.
app.use(errorHandler);



export default app;