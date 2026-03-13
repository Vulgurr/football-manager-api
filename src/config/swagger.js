import swaggerJSDoc from "swagger-jsdoc";
import { __dirname } from "./dotenv.js";
import path from "path";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Equipos de Fútbol",
      version: "1.0.0",
      description: "Documentación de la API para gestionar equipos y usuarios.",
      contact: {
        name: "Agustin",
        email: "aguspassa@hotmail.com"
      }
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Servidor Local"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Aca le decimos dónde buscar los comentarios con la documentación
  apis: [
      path.join(__dirname, "../routes/*.js"), // Busca en todas las rutas
  ], 
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
