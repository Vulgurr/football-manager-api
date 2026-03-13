//express reconoce a una funcion con estos 4 parametros como un handler de errores
//el next va aunque no se use, por eso silenciamos a eslint
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    // Log para debuggear
    if(process.env.NODE_ENV==="development"){
        console.error(`Error: ${err.message}`); 
    if (err.name === "SequelizeValidationError") {
        console.error(err.errors.map(e => e.message));
    }
    }

    //! --- ERRORES DE AUTENTICACIÓN Y SEGURIDAD (401 / 403) ---
    
    // Login fallido (Email no existe O contraseña mal)
    if (err.message === "CREDENCIALES_INVALIDAS") {
        return res.status(401).json({
            status: "error",
            message: "Usuario o contraseña incorrectos."
        });
    }
    
    if (err.message === "USUARIO_INACTIVO") { //usuario baneado
        return res.status(403).json({
            status: "error",
            message: "Tu cuenta ha sido suspendida. Contacta al soporte."
        });
    }
    if (err.message === "ACCESO_DENEGADO_OTRO_USUARIO") { //usuario baneado
        return res.status(403).json({
            status: "error",
            message: "El ID de usuario no coincide con el token de sesión suministrado."
        });
    }
    // Falta el Token
    if (err.message === "TOKEN_NO_PROVISTO") {
        return res.status(401).json({
            status: "error",
            message: "Acceso denegado. Token no proporcionado."
        });
    }

    if(err.message === "TOKEN_EXPIRADO"){
        return res.status(401).json({
            status: "error",
            message: "Tu sesión ha caducado. Por favor inicia sesión nuevamente."
        });
    }
    if(err.message === "SESION_INVALIDADA"){
        return res.status(401).json({
            status: "error",
            message: "Se ha detectado un inicio de sesión en otro dispositivo. Por seguridad, se ha cerrado esta sesión."
        });
    }

    // Token vencido o falso
    if (err.message === "TOKEN_INVALIDO" || err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            status: "error",
            message: "Sesión inválida o expirada. Por favor inicie sesión nuevamente."
        });
    }

    // Contraseña actual errónea (al intentar cambiar pass/email)
    if (err.message === "PASS_INCORRECTA") {
        return res.status(401).json({
            status: "error",
            message: "La contraseña actual ingresada es incorrecta."
        });
    }
    // Datos repetidos

    if (err.message === "MISMO_EMAIL") {
        return res.status(401).json({
            status: "error",
            message: "El email nuevo no puede ser el mismo que el actual."
        });
    }
    if (err.message === "MISMA_PASSWORD") {
        return res.status(401).json({
            status: "error",
            message: "La contraseña nueva no puede ser la misma que la actual."
        });
    }

    // Permisos insuficientes (Admin)
    if (err.message === "ACCESO_DENEGADO") {
        return res.status(403).json({
            status: "error",
            message: "No tienes permisos de administrador para realizar esta acción."
        });
    }

    // --- ERRORES DE VALIDACIÓN DE DATOS (400) ---
    
    const erroresDeValidacion = [
        "FALTAN_DATOS", 
        "MAIL_INVALIDO", 
        "PASS_INVALIDO", 
        "NAME_INVALIDO",
        "DATOS_INCOMPLETOS"
    ];

    if (erroresDeValidacion.includes(err.message)) {
        return res.status(400).json({
            status: "error",
            message: "Datos de solicitud inválidos.",
            detalle: err.message // Devuelve "MAIL_INVALIDO", etc.
        });
    }

    // Errores automáticos de Sequelize (Validaciones del Modelo)
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
            status: "error",
            message: "Error de validación en base de datos.",
            errors: err.errors.map(e => e.message)
        });
    }

    // --- ERRORES DE RECURSOS NO ENCONTRADOS (404) ---
    
    if (err.message === "ID_NO_ENCONTRADO" || err.message === "USUARIO_INEXISTENTE") {
        return res.status(404).json({
            status: "error",
            message: "El recurso solicitado no existe."
        });
    }

    // --- ERRORES DE CONFLICTO / DUPLICADOS (409) ---
    
    if (err.message === "EQUIPO_DUPLICADO" || 
        err.message === "EMAIL_DUPLICADO" || 
        err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            status: "error",
            message: "El dato ingresado ya existe (Email o Nombre duplicado)."
        });
    }
     // Errores de formato en imagenes
     if (err.message === "ERROR_SUBIDA_ARCHIVO") {
        return res.status(400).json({
            status: "error",
            message: "Error en la subida del archivo.",
            errors: err.errors.map(e => e.message)
        });
    }
    if (err.message === "FORMATO_INVALIDO") {
        return res.status(400).json({
            status: "error",
            message: "Formato de archivo no aceptado.",
            errors: err.errors.map(e => e.message)
        });
    }
    // Si no cayó en ninguno de los anteriores, es un crash inesperado.
    console.error("CRITICAL ERROR:", err);
    res.status(500).json({
        status: "error",
        message: "Error interno del servidor."
    });
};