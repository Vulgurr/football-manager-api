
import jwt from "jsonwebtoken";
import * as dataLogin from "../services/managerLoginSequelize.js";
import { autenticarUsuario, incrementarTokenVersion } from "../services/managerLoginSequelize.js";

const KEY_SECRETA = process.env.JWT_KEY;
//Aca es una variable de entorno (.env)
//!ESTO NO SE SUBE A GITHUB, está por defecto en gitignore

export async function login(req, res, next) {
    const { email, password } = req.body;

    if (!KEY_SECRETA) {
        // Si no hay clave, detenemos todo el servidor.
        console.error("FATAL ERROR: No se ha definido JWT_KEY en las variables de entorno.");
        process.exit(1);
    }

    try {

        const usuario = await autenticarUsuario({ email, password });   
        //Recargamos el usuario para tener el numero actualizado
        const usuarioTokenIncrementado=await incrementarTokenVersion(usuario.id);
        // Generación del Token 
        const payload = {
            id: usuarioTokenIncrementado.id,
            name: usuarioTokenIncrementado.name,
            rol: usuarioTokenIncrementado.rol,
            tokenVersion: usuarioTokenIncrementado.tokenVersion
        };

        const token = jwt.sign(payload, KEY_SECRETA, { expiresIn: "2h" });
        res.status(200).json({
            mensaje: "Login exitoso",
            token: token,
            user: {
                id: usuarioTokenIncrementado.id,
                email: usuarioTokenIncrementado.email,
                rol: usuarioTokenIncrementado.rol,
                name: usuarioTokenIncrementado.name
            }
        });

    } catch (error) {
        next(error);
    }
};

export async function registrarUsuario(req, res, next) {
    try {
        const usuario = req.body;

        const resultado = await dataLogin.registrarUsuario(usuario);

        res.status(201).json(resultado);

    } catch (error) {
        next(error);
    }
}
export async function cambiarPassword(req, res, next) {
    try {
        const id = req.user.id;
        const { password, nuevaPassword } = req.body;

        const resultado = await dataLogin.cambiarPassword(id, password, nuevaPassword);

        res.status(200).json(resultado);

    } catch (error) {
        next(error);
    }
}

export async function cambiarEmail(req, res, next) {
    try {
        const id = req.user.id;
        const { password, nuevoEmail } = req.body;

        const resultado = await dataLogin.cambiarEmail(id, password, nuevoEmail);

        res.status(200).json(resultado);

    } catch (error) {
        next(error);
    }
}