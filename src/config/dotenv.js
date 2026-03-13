import dotenv from "dotenv";
//!Este import de dotenv carga todas las variables de entorno a todo el servidor
//No ponerlo implica no poder usarlo en ninguna parte del proyecto
//Si o si tiene que ir primero, o antes que cualquiera que lo use
import path, { dirname } from "path";
import { fileURLToPath } from "url";


const actualFilename = fileURLToPath(import.meta.url);
const actualDirname = dirname(actualFilename);

dotenv.config({ path: path.join(actualDirname, "../../.env") });
dotenv.config({ path: path.join(actualDirname, "../../.env") });

export { actualFilename as __filename, actualDirname as __dirname};
//les tengo que cambiar el nombre porque babel traduce esto como common js, y ahi las variables filename y dirname existen.

