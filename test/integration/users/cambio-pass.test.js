/** @jest-environment node */

import request from "supertest";
import app from "../../../src/app.js";
import { sequelize } from "../../../src/BD/sequelize.js";
import bcrypt from "bcrypt";
import { borrarUsuarioRegistrado, crearYRegistrarUsuario, logearUsuario} from "../../utils/setup.js";
import { getUsuarioPorID } from "../../../src/services/managerLoginSequelize.js";
import jwt from "jsonwebtoken";

describe("Auth Integration Tests (POST /auth/cambiar-password)", () => {
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
    test("Deberia cambiar la contraseña correctamente", async () => {
        const passNueva = "123riBer!!";
        const usuarioConPassCambiada = {
            id: usuario.id,
            password:usuario.password,
            nuevaPassword: passNueva
        };
        const response = await request(app).patch("/auth/cambiar-password")
            .set("Authorization", `Bearer ${usuario.token}`)
            .send(usuarioConPassCambiada);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("Contraseña cambiada exitosamente");
        const usuarioBD = await getUsuarioPorID(usuario.id);
        const esLaMismaPassEnBD=await bcrypt.compare(passNueva, usuarioBD.hashPassword);
        expect(esLaMismaPassEnBD).toBe(true);
    });

    test("Deberia rechazar una contraseña invalida", async () => {
        const passNueva = "FaltanNumeros!!!";
        const usuarioConPassCambiada = {
            id: usuario.id,
            password:usuario.password,
            nuevaPassword: passNueva
        };
        const response = await request(app).patch("/auth/cambiar-password")
            .set("Authorization", `Bearer ${usuario.token}`)
            .send(usuarioConPassCambiada);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");
    });
    test("Deberia rechazar la petición si el token es incorrecto", async () => {
        const passNueva = usuario.password;
        const usuarioConPassCambiada = {
            id: usuario.id,
            password:usuario.password,
            nuevaPassword: passNueva
        };
        const response = await request(app).patch("/auth/cambiar-password")
            .set("Authorization", `Bearer ${"boca.juniors.xs"}`)
            .send(usuarioConPassCambiada);
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Sesión inválida o expirada. Por favor inicie sesión nuevamente.");
    });

    test("Debería rechazar el acceso si no se provee ningún token", async () => {
        const response = await request(app).patch("/auth/cambiar-password"); // Sin el header .set()

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Acceso denegado. Token no proporcionado.");
    });
    test("Deberia rechazar un token firmado por otra llave", async () => {
        const passNueva = usuario.password;
        const usuarioConPassCambiada = {
            id: usuario.id,
            password:usuario.password,
            nuevaPassword: passNueva
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
        const response = await request(app).patch("/auth/cambiar-password")
            .set("Authorization", `Bearer ${tokenFalso}`)
            .send(usuarioConPassCambiada);
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Sesión inválida o expirada. Por favor inicie sesión nuevamente.");
    });
     test("No debe permitir que un usuario use el token de otro usuario", async () => {
        let usuario2= await crearYRegistrarUsuario("zz");
        usuario2=await logearUsuario(usuario2);
        const passNueva = "123riBer!!";
        const usuarioConPassCambiada = {
            id: usuario2.id,
            password:usuario2.password,
            nuevaPassword: passNueva
        };
        const response= await request(app).patch("/auth/cambiar-password")
        .set("Authorization", `Bearer ${usuario.token}`)
        .send(usuarioConPassCambiada);
        
        expect(response.body.message).toBe("El ID de usuario no coincide con el token de sesión suministrado.");
        expect(response.statusCode).toBe(403);
        borrarUsuarioRegistrado(usuario2.id);
    });
    test("Debe rechazar el cambio si es la misma contraseña", async() =>{
        const usuarioSinPassCambiada = {
            id: usuario.id,
            password:usuario.password,
            nuevaPassword: usuario.password
        };
        const response= await request(app).patch("/auth/cambiar-password")
        .set("Authorization", `Bearer ${usuario.token}`)
        .send(usuarioSinPassCambiada);

        expect(response.body.message).toBe("La contraseña nueva no puede ser la misma que la actual.");
        expect(response.statusCode).toBe(401);
    });

});
