import { esMailValido, esNombreValido, esPassValida } from "../utils/helpers.js";
export const verificarDatosRegistro = (req, res, next) => {
    const { name, email, password } = req.body;

    //Verificamos que lleguen todos los campos obligatorios y si son correctos
    if (!name || !email || !password) {
        return next(new Error("FALTAN_DATOS"));
    }
    if (!esMailValido(email)) {
        return next(new Error("MAIL_INVALIDO"));
    }
    if (!esPassValida(password)) {
        return next(new Error("PASS_INVALIDO"));
    }
    if (!esNombreValido(name)) {
        return next(new Error("NAME_INVALIDO"));
    }

    next();
};
export function verificarDatosLogin(req, res, next){
    const { email, password } = req.body;
    if (!email || !password) return next(new Error("FALTAN_DATOS"));
    if (!esMailValido(email)) return next(new Error("MAIL_INVALIDO")); 
    if (!esPassValida(password)) return next(new Error("PASS_INVALIDO"));
    next();
};

export function verificarDatosCambioPassword(req, res, next){
    // Del usuario (Token) solo nos importa que exista el ID para saber quién es.
    // No buscamos el hashPassword acá porque el token no lo tiene.
    if (!req.user || !req.user.id) return next(new Error("TOKEN_INVALIDO"));

    const { password, nuevaPassword } = req.body;

    // "password" es la actual (para confirmar identidad)
    // "nuevaPassword" es la que quiere poner
    if (!password || !nuevaPassword) return next(new Error("FALTAN_DATOS"));
    
    if (!esPassValida(nuevaPassword)) return next(new Error("PASS_INVALIDO"));
    const idToken=req.user.id;
    const idUsuario=req.body.id;
    if (Number(idUsuario) !== Number(idToken)) {
        return next(new Error("ACCESO_DENEGADO_OTRO_USUARIO"));
    }
    
    next();
};

export function verificarDatosCambioEmail(req, res, next){
    if (!req.user || !req.user.id) return next(new Error("TOKEN_INVALIDO"));

    const {  password, nuevoEmail } = req.body;
    // Necesitamos la contraseña actual para autorizar el cambio de mail
    if (!password || !nuevoEmail) return next(new Error("FALTAN_DATOS"));
    
    if (!esMailValido(nuevoEmail)) return next(new Error("MAIL_INVALIDO")); 
    const idToken=req.user.id;
    const idUsuario=req.body.id;
    if (Number(idUsuario) !== Number(idToken)) {
        return next(new Error("ACCESO_DENEGADO_OTRO_USUARIO"));
    }
    
    next();
};