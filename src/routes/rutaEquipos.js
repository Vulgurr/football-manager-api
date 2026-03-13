import express from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import * as equipoController from "../controllers/equipo.controller.js";
import { paginar } from "../middleware/equipo.middleware.js";
import { uploadErrorHandler } from "../middleware/images.middleware.js";
//!Las rutas aca adentro parten de que ya estás en /equipos

const equipoRoutes = express.Router();
/*
!EXPLICACION
 abajo vas a ver un montón de comentarios que son documentación para api-docs. Para proyectos pequeños-medianos
 es una opción válida ponerlo arriba de los métodos, pero para un proyecto más grande ya se vuelve inviable y hay que
 empezar a hacer archivos.yaml separados*/
//El get general, obtiene todos los equipos
/**
 * @swagger
 * /equipos/general:
 *   get:
 *     summary: Obtiene una lista paginada de equipos
 *     tags:
 *       - Equipos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados
 *
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda (nombre)
 *
 *     responses:
 *       200:
 *         description: Lista obtenida con éxito
 *       500:
 *         description: Error del servidor
 */

equipoRoutes.get("/general", verificarToken, paginar,equipoController.getGeneral);

/**
 * @swagger
 * /equipos/{equipo}:
 *   get:
 *     summary: Obtiene el detalle de un equipo
 *     tags:
 *       - Equipos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: equipo
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *
 *     responses:
 *       200:
 *         description: Equipo encontrado
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */


equipoRoutes.get("/:id", verificarToken, equipoController.getEquipo);

/**
 * @swagger
 * /equipos/borrar/{id}:
 *   delete:
 *     summary: Elimina un equipo (Solo Admin)
 *     tags:
 *       - Equipos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo a borrar
 *
 *     responses:
 *       200:
 *         description: Equipo eliminado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */


equipoRoutes.delete("/borrar/:id", verificarToken, equipoController.borrarEquipo);

/**
 * @swagger
 * /equipos/modificar:
 *   patch:
 *     summary: Modifica un equipo existente
 *     tags:
 *       - Equipos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               shortName:
 *                 type: string
 *               tla:
 *                 type: string
 *               area:
 *                 type: string
 *                 description: JSON String del área
 *               image:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       200:
 *         description: Actualizado correctamente
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno
 */


equipoRoutes.patch("/modificar", verificarToken, uploadErrorHandler("image"), equipoController.modificarEquipo);

/**
 * @swagger
 * /equipos/agregar:
 *   post:
 *     summary: Crea un nuevo equipo
 *     tags:
 *       - Equipos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shortName:
 *                 type: string
 *               tla:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               email:
 *                 type: string
 *               founded:
 *                 type: integer
 *               clubColors:
 *                 type: string
 *               venue:
 *                 type: string
 *               area:
 *                 type: string
 *                 description: JSON String (e.g. '{"id":22}')
 *               image:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       201:
 *         description: Creado exitosamente
 *       409:
 *         description: Equipo duplicado
 *       500:
 *         description: Error interno
 */


equipoRoutes.post("/agregar", verificarToken, uploadErrorHandler("image"), equipoController.agregarEquipo);

export default equipoRoutes;

