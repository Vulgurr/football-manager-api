import multer from "multer";
import { uploadCloudinary } from "../config/cloudinary.js";

/**
 * Middleware Factory: Crea un middleware para un campo específico
 * @param {string} fieldName - El nombre del campo en el form-data (ej: 'image')
 */
export const uploadErrorHandler = (fieldName) => {
    return (req, res, next) => {
        
        // Creamos la función de subida específica para ese campo
        const uploadFn = uploadCloudinary.single(fieldName);

        uploadFn(req, res, (err) => {
            // Error de Multer (Tamaño, field name incorrecto, etc)
            if (err instanceof multer.MulterError) {
                const error = new Error("ERROR_SUBIDA_ARCHIVO");
                return next(error);
            }
           

            // Error de Cloudinary/Storage (Tipo de archivo inválido)
            if (err) {
                 const error = new Error("FORMATO_INVALIDO");
                return next(error);
            }
            next();
        });
    };
};