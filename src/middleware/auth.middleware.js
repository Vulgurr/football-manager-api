import jwt from "jsonwebtoken";
import { getUsuarioPorID } from "../services/managerLoginSequelize.js";
const KEY_SECRETA = process.env.JWT_KEY;

export const verificarToken = async (req, res, next) => {
    // Buscamos el header "Authorization"
    const authHeader = req.headers["authorization"];

    // Si no hay header, o no tiene el formato correcto, extraemos undefined
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next(new Error("TOKEN_NO_PROVISTO"));
    }

    try {
        // Verificamos si es válido
        const decodificado = jwt.verify(token, KEY_SECRETA);
        const usuario = await getUsuarioPorID(decodificado.id);

        if (usuario.tokenVersion !== decodificado.tokenVersion)
            throw new Error("SESION_INVALIDADA");
        req.user = usuario;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new Error("TOKEN_EXPIRADO"));
        }
        if (error.name === "JsonWebTokenError") {
            return next(new Error("TOKEN_INVALIDO"));
        }
        return next(error);
    }
};