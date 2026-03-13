# Football Manager API - Backend RESTful

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

Backend robusto y seguro para una aplicación de gestión de equipos de fútbol. Construido con arquitectura de 3 capas, testing automatizado y políticas de seguridad para producción.

🌍 **Live Demo (Frontend):** [Gestor Fútbol App](https://manager-futbol.netlify.app)

🔗 **URL Base de la API:** `https://frontend-practica.onrender.com`

---

## Funcionalidades
- **Gestión Completa de Equipos:** CRUD de equipos de fútbol.
- **Sistema de Roles:** Permisos diferenciados para Usuarios Normales (solo editan lo propio) y Administradores (control total).
- **Subida de Imágenes:** Procesamiento de escudos de equipos con validación de formato y tamaño.
- **Búsqueda Avanzada:** Filtrado por nombre y paginación desde el backend para optimizar el rendimiento.

## Arquitectura y Tecnologías

* **Core:** Node.js + Express usando ES Modules (`import`/`export`).
* **Base de Datos:** PostgreSQL alojado en Supabase.
* **ORM:** Sequelize.
* **Almacenamiento de Archivos:** Cloudinary con streams gestionados vía Multer.
* **Testing:** Jest + Supertest (Cobertura de integración con base de datos de prueba dedicada y mockeo de APIs externas).

## Seguridad Implementada

* **Autenticación:** JWT (JSON Web Tokens) y encriptación de contraseñas con Bcrypt.
* **CORS:** Configuración estricta validando orígenes (`allowedOrigins`) para aislar la comunicación con el frontend en Netlify.
* **Helmet:** Protección contra vulnerabilidades web comunes (Clickjacking, MIME sniffing).
* **Rate Limiting:** Límite de peticiones por IP para prevenir ataques de fuerza bruta y DDoS.
* **File Validation:** Middleware personalizado (`fileFilter`) en Multer para bloquear archivos maliciosos.

## Instalación y Uso Local

1. Clonar el repositorio:
    ```bash
     git clone https://github.com/Vulgurr/football-manager-api.git
     ```
2. Instalar dependencias:
    ```bash
    cd football-manager-api
    npm install
    ```
3. Configurar variables de entorno (crear archivo ```.env```):
    ```
    PORT=8080
    NODE_ENV=development 
    DB_ENABLE_SSL=false
    JWT_KEY=TU_LLAVE_SECRETA
    BCRYPT_ROUNDS=10
    FRONTEND_URL=http://localhost:5173
    CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME
    CLOUDINARY_API_KEY=TU_CLOUD_API_KEY
    CLOUDINARY_API_SECRET=TU_CLOUD_API_SECRET
    DB_NAME_TEST=TU_BD_TEST
    DB_URI=TU_DB_URI
    DB_URI_TEST=TU_DB_URI_TEST
    ```
4. Iniciar el servidor:
   ```bash
   npm run dev
   ```
## Testing
El proyecto cuenta con una suite de tests de integración para garantizar el correcto funcionamiento de las rutas y la base de datos. Se utiliza un mock de la API de Cloudinary para evitar llamadas a la red durante los tests.
Para ejecutar los tests y probar la funcionalidad, ejecuta:
* ```npm run test:units``` Para tests unitarios.
* ```npm run test:int``` Para tests de integración. El comando viene con el flag ```--runInBand``` para evitar race conditions.

---
**¿Buscas el Frontend?** Puedes ver el repositorio del cliente desarrollado en React [haciendo clic aquí](https://github.com/Vulgurr/football-manager-frontend).
> **Aviso de Cold Start:** Al estar alojado en el plan gratuito de Render, el servidor entra en reposo tras períodos de inactividad. La primera petición puede tardar hasta un minuto en responder.
