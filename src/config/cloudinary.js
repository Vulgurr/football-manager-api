import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configuramos Cloudinary con las credenciales del dotenv
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "equipos-futbol", // Nombre de la carpeta en tu nube
        allowed_formats: ["jpg", "png", "jpeg", "webp"], // Formatos permitidos
    }
});

const filtroDeImagenes = (req, file, cb) => {
    // Verificamos si el tipo de archivo (mimetype) empieza con "image/"
    if (file.mimetype.startsWith("image/")) {
        cb(null, true); // ¡Es una imagen! Lo dejamos pasar.
    } else {
        // ¡No es una imagen! Lo bloqueamos antes de que intente subirlo.
        cb(new Error("El archivo no es una imagen"), false); 
    }
};

//Limite de archivos en 5MB
export const uploadCloudinary = multer({ storage: storage, fileFilter:filtroDeImagenes, limits: { fileSize: 5 * 1024 * 1024 } });