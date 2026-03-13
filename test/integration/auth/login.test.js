/** @jest-environment node */

import request from "supertest";
import app from "../../../src/app.js";
import Usuario from "../../../src/models/usuario.js";
import { sequelize } from "../../../src/BD/sequelize.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const KEY_SECRETA = process.env.JWT_KEY;
const CANTIDAD_RONDAS = 4;
import { crearYRegistrarUsuario, borrarUsuarioRegistrado } from "../../utils/setup.js";


describe("Auth Integration Tests (POST /auth/login)", () => {

    // Antes de todos los tests sincronizamos la base de datos de TEST
    beforeAll(async () => {
        // force: true limpia la base de datos de test antes de empezar
        await sequelize.sync({ force: true });
    });

    // Después de todos los tests, cerramos la conexión
    //Si no la cerras los tests no terminan
    afterAll(async () => {
        await sequelize.close();
    });

    let usuario;

    beforeEach(async () => {
        usuario = await crearYRegistrarUsuario();
    });


    afterEach(async () => {
        // Limpiamos la basura que dejó el test
        if (usuario && usuario.id) {
            await borrarUsuarioRegistrado(usuario.id);
        }
    });

    test("Debería logear un usuario exitosamente y devolver 200", async () => {
        //tiene id, pass y mail
        const response = await request(app).post("/auth/login").send(usuario);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toHaveProperty("id");
        expect(response.body.user).toHaveProperty("rol");
        expect(response.body.user).toHaveProperty("email");
        expect(response.body.user).toHaveProperty("name");
        // Verificamos que no devuelva la contraseña por seguridad
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("hashPassword");
        expect(response.body.user).not.toHaveProperty("password");
        expect(response.body.user).not.toHaveProperty("hashPassword");

    });

    test("Debería rechazar un usuario con email inexistente", async () => {
        usuario.email = "pedro@perezzz.com";

        const response = await request(app).post("/auth/login").send(usuario);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Usuario o contraseña incorrectos.");


    });
    test("Debería rechazar un usuario con contraseña incorrecta", async () => {
        usuario.password += "aaa";

        const response = await request(app).post("/auth/login").send(usuario);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Usuario o contraseña incorrectos.");


    });
    test("Debería rechazar un usuario con contraseña invalida", async () => {
        usuario.password = "asd";

        const response = await request(app).post("/auth/login").send(usuario);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");


    });
    test("Debería rechazar un usuario con email invalido", async () => {
        usuario.email = "asd";

        const response = await request(app).post("/auth/login").send(usuario);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");


    });
    test("Debería rechazar dos login al mismo tiempo del mismo usuario", async () => {
        const resLogin1 = await request(app).post("/auth/login").send(usuario);
        const tokenViejo = resLogin1.body.token; // Guardamos el token "A"
        expect(tokenViejo).toBeDefined();

        const resLogin2 = await request(app).post("/auth/login").send(usuario);
        const tokenNuevo = resLogin2.body.token; // Guardamos el token "B", que inutiliza a A
        expect(tokenNuevo).not.toBe(tokenViejo);

        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${tokenViejo}`) //hago la peticion con el token viejo
            .send({
                id: usuario.id,
                "nuevoEmail": "juanperez@gmail.com",
                "password": usuario.password
            });
        //Realmente no va a llegar a hacer la petición completa, pero necesito hacer alguna 
        // acción para que rebote por el token
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Se ha detectado un inicio de sesión en otro dispositivo. Por seguridad, se ha cerrado esta sesión.");

    });
    test("Deberia rechazar el login de un usuario baneado", async () => {
        const usuarioBaneado = {
            email: "pedro@pedro.com",
            password: "123Bocaaa!!"
        };
        const passHash = await bcrypt.hash(usuarioBaneado.password, CANTIDAD_RONDAS);
        const resRegistro = await Usuario.create({
            name: "pedro perez",
            email: usuarioBaneado.email,
            hashPassword: passHash,
            activo: false
        });
        const idBaneada = resRegistro.id;
        const response = await request(app).post("/auth/login").send(usuarioBaneado);
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe("Tu cuenta ha sido suspendida. Contacta al soporte.");
        await borrarUsuarioRegistrado(idBaneada);
    });
    //!PUNTO DE EXPANSION
    /*
    Esto es un punto de expansión pero que creo que el proyecto no justifica por el momento.
    Ahora mismo el baneo es un booleano de si estás baneado o no, no se rige por tiempo o por
    cantidad de intentos fallidos.
        Esta funcionalidad se puede expandir de las siguientes maneras:
            - Si falla X cantidad de veces en un determinado tiempo, se lo banea por Y tiempo
            - El baneo se va solo después de Y minutos 
    */
    test("El token no debería contener información sensible y debe contener la información necesaria", async () => {
        const resLogin = await request(app).post("/auth/login").send(usuario);
        const token = resLogin.body.token; // Guardamos el token
        expect(token).toBeDefined();
        const payload = jwt.verify(token, KEY_SECRETA);
        expect(payload).not.toHaveProperty("password");
        expect(payload).not.toHaveProperty("hashPassword");

        expect(payload).toHaveProperty("id", usuario.id);
        expect(payload).toHaveProperty("rol", usuario.rol);

        expect(payload).toHaveProperty("exp"); //fecha de expiracion

    });
    test("El sistema rechaza peticiones si el token ha expirado", async () => {
        // Generamos manualmente un token que ya nació vencido.
        const tokenVencido = jwt.sign(
            {
                id: usuario.id,
                tokenVersion: usuario.tokenVersion
            },
            KEY_SECRETA,
            { expiresIn: "-2h" } //Esto simula que pasaron 2 horas
        );
        // Intentamos hacer una petición protegida con ese token "viejo"
        // Usamos cualquier endpoint protegido
        const response = await request(app)
            .get("/equipos/general")
            .set("Authorization", `Bearer ${tokenVencido}`);

        expect(response.statusCode).toBe(401);

    });


});


