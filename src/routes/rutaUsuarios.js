import express from "express";
// Ahora hay que subir un nivel (..) para llegar a BD
import { verificarToken } from "../middleware/auth.middleware.js";
import * as AuthController from "../controllers/auth.controller.js";
import { verificarDatosRegistro, verificarDatosLogin, 
    verificarDatosCambioPassword, verificarDatosCambioEmail } from "../middleware/login.middleware.js";

const authRoutes = express.Router(); 

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve un Token JWT
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *
 *     responses:
 *       200:
 *         description: Login exitoso. Devuelve el token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para usar en las otras rutas
 *                 usuario:
 *                   type: object
 *                   description: Datos del usuario logueado
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error del servidor
 */

authRoutes.post("/login", verificarDatosLogin, AuthController.login);
//Para ver la implementacion anda a la ruta

/**
 * @swagger
 * /auth/registrarse:
 *   post:
 *     summary: Registra un nuevo usuario en el sistema
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Perez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nuevo@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: passwordSegura123
 *
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Faltan datos o contraseña inválida
 *       404:
 *         description: Formato de mail o nombre inválido
 *       409:
 *         description: El email ya está registrado
 *       500:
 *         description: Error del servidor
 */


authRoutes.post("/registrarse", verificarDatosRegistro, AuthController.registrarUsuario);

/**
 * @swagger
 * /auth/cambiar-password:
 *   patch:
 *     summary: Cambia la contraseña del usuario
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *               - nuevaPassword
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID del usuario
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña ACTUAL para validar identidad
 *               nuevaPassword:
 *                 type: string
 *                 format: password
 *                 description: La nueva contraseña deseada
 *
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Faltan datos o la nueva contraseña no es válida
 *       401:
 *         description: La contraseña actual es incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno
 */


authRoutes.patch("/cambiar-password",verificarToken,verificarDatosCambioPassword, AuthController.cambiarPassword);

/**
 * @swagger
 * /auth/cambiar-email:
 *   patch:
 *     summary: Actualiza el email del usuario
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *               - nuevoEmail
 *             properties:
 *               id:
 *                 type: integer
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual para validar
 *               nuevoEmail:
 *                 type: string
 *                 format: email
 *                 description: El nuevo correo electrónico
 *
 *     responses:
 *       200:
 *         description: Email actualizado correctamente
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El nuevo email ya está en uso por otro usuario
 *       500:
 *         description: Error interno
 */


authRoutes.patch("/cambiar-email",verificarToken,verificarDatosCambioEmail, AuthController.cambiarEmail);

export default authRoutes;

