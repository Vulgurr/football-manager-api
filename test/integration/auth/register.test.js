/** @jest-environment node */

import request from "supertest";
import app from "../../../src/app.js";
import Usuario from "../../../src/models/usuario.js";
import { sequelize } from "../../../src/BD/sequelize.js";

describe("Auth Integration Tests (POST /auth/register)", () => {
    
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });
    afterAll(async () => {
        await sequelize.close();
    });

    test("Debería registrar un usuario exitosamente y devolver 201", async () => {
        const nuevoUsuario = {
            name: "Test User",
            email: "test@example.com",
            password: "pAssword123!"
        };

        const response = await request(app)
            .post("/auth/registrarse")
            .send(nuevoUsuario);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.email).toBe(nuevoUsuario.email);
        // Verificamos que no devuelva la contraseña por seguridad
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("hashPassword");
    });

    test("Debería fallar si el email ya existe (Error 409)", async () => {
        const usuarioBase = {
            name: "Usuario Dos",
            email: "dos@test.com", 
            password: "pAssword123!"
        };
        
        // Lo insertamos. Podríamos usar la API o Sequelize directo.
        // Usar Sequelize directo es más rápido y "limpio" para el setup.
        await Usuario.create({
             name: usuarioBase.name,
             email: usuarioBase.email,
             hashPassword: "hash_simulado_o_real" 
        });

        const response = await request(app)
            .post("/auth/registrarse")
            .send(usuarioBase);

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe("El dato ingresado ya existe (Email o Nombre duplicado).");
    });
    test("Debería fallar si recibe un mail inválido", async () => {
        const nuevoUsuario = {
            name: "Test User tres",
            email: "testexample.com",
            password: "pAssword123!"
        };

        const response = await request(app)
            .post("/auth/registrarse")
            .send(nuevoUsuario);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");
    });
    test("Debería fallar si recibe una contraseña inválida", async () => {
        const nuevoUsuario = {
            name: "Test User tres",
            email: "test@example.com",
            password: "contrasenia"
        };

        const response = await request(app)
            .post("/auth/registrarse")
            .send(nuevoUsuario);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");
    });
    test("Debería fallar si recibe un nombre inválido", async () => {
        const nuevoUsuario = {
            name: "383873",
            email: "test@example.com",
            password: "pAssword123!"
        };

        const response = await request(app)
            .post("/auth/registrarse")
            .send(nuevoUsuario);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Datos de solicitud inválidos.");
    });
});