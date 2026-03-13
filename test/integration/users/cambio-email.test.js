/** @jest-environment node */
import request from "supertest";
import app from "../../../src/app.js";
import { sequelize } from "../../../src/BD/sequelize.js";
import { getUsuarioPorID } from "../../../src/services/managerLoginSequelize.js";
import { borrarUsuarioRegistrado, crearYRegistrarUsuario, logearUsuario} from "../../utils/setup.js";
import jwt from "jsonwebtoken";

describe("Auth Integration Tests (POST /auth/cambiar-email)", () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });
    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(async () => {
        usuario = await crearYRegistrarUsuario();
        usuario =await logearUsuario(usuario);
    });


    afterEach(async () => {
        if (usuario && usuario.id) {
            await borrarUsuarioRegistrado(usuario.id);
        }
    });

    let usuario;
    test("Deberia cambiar el email correctamente", async () => {
        const nuevoEmail = "pedronuevo@hotmail.com";
        const usuarioConMailCambiado = {
            id: usuario.id,
            nuevoEmail: nuevoEmail,
            password: usuario.password
        };
        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${usuario.token}`)
            .send(usuarioConMailCambiado);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("mensaje", "Email actualizado correctamente");

        const usuarioBD = await getUsuarioPorID(usuario.id);
        expect(usuarioBD).toHaveProperty("email", nuevoEmail);
    });

    test("Deberia rechazar un mail invalido", async () => {
        const nuevoEmail = "pedronuevohotmail.com";
        const usuarioConMailCambiado = {
            id: usuario.id,
            nuevoEmail: nuevoEmail,
            password: usuario.password
        };
        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${usuario.token}`)
            .send(usuarioConMailCambiado);
        
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");
    });

    test("Deberia rechazar una contraseña incorrecta", async () => {
        const nuevoEmail = "pedronuevo@hotmail.com";
        const usuarioConMailCambiado = {
            id: usuario.id,
            nuevoEmail: nuevoEmail,
            password: usuario.password + "a"
        };
        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${usuario.token}`)
            .send(usuarioConMailCambiado);
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("La contraseña actual ingresada es incorrecta.");
    });

    test("Deberia rechazar la petición si el token es incorrecto", async () => {
        const nuevoEmail = "pedronuevo@hotmail.com";
        const usuarioConMailCambiado = {
            id: usuario.id,
            nuevoEmail: nuevoEmail,
            password: usuario.password
        };
        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${"boca.juniors.123"}`)
            .send(usuarioConMailCambiado);
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Sesión inválida o expirada. Por favor inicie sesión nuevamente.");
    });

    test("Debería rechazar el acceso si no se provee ningún token", async () => {
        const response = await request(app).patch("/auth/cambiar-email"); // Sin el header .set()

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Acceso denegado. Token no proporcionado.");
    });
    test("Deberia rechazar un token firmado por otra llave", async () => {
        const nuevoEmail = "pedronuevo@hotmail.com";
        const usuarioConMailCambiado = {
            id: usuario.id,
            nuevoEmail: nuevoEmail,
            password: usuario.password
        };
        const llaveAtaque = "clave-secreta-erronea-totalmente-distinta";
        const payload = {
            id: usuario.id,
            name: usuario.name,
            rol: usuario.rol,
            tokenVersion: 1
        };
        //uso toda la info publica del token
        const tokenFalso = jwt.sign(payload, llaveAtaque, { expiresIn: "2h" });
        const response = await request(app).patch("/auth/cambiar-email")
            .set("Authorization", `Bearer ${tokenFalso}`)
            .send(usuarioConMailCambiado);
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Sesión inválida o expirada. Por favor inicie sesión nuevamente.");
    });
     test("No debe permitir que un usuario use el token de otro usuario", async () => {
        const nuevoEmail = "pedronuevo@hotmail.com";
        let usuario2= await crearYRegistrarUsuario("zz");
        usuario2=await logearUsuario(usuario2);
        const usuarioConMailCambiado = {
            id: usuario2.id,
            nuevoEmail: nuevoEmail,
            password: usuario2.password
        };
        const response= await request(app).patch("/auth/cambiar-email")
        .set("Authorization", `Bearer ${usuario.token}`)
        .send(usuarioConMailCambiado);
        
        expect(response.body.message).toBe("El ID de usuario no coincide con el token de sesión suministrado.");
        expect(response.statusCode).toBe(403);
        borrarUsuarioRegistrado(usuario2.id);
    });
    test("Debe rechazar el cambio si es el mismo mail", async() =>{
        const usuarioSinMailCambiado = {
            id: usuario.id,
            nuevoEmail: usuario.email,
            password: usuario.password
        };
        const response= await request(app).patch("/auth/cambiar-email")
        .set("Authorization", `Bearer ${usuario.token}`)
        .send(usuarioSinMailCambiado);

        expect(response.body.message).toBe("El email nuevo no puede ser el mismo que el actual.");
        expect(response.statusCode).toBe(401);
    });

});


