/** @jest-environment node */

import request from "supertest";
import app from "../../../src/app.js";
import { sequelize } from "../../../src/BD/sequelize.js";
import { cargarEquiposTest } from "../../utils/setup.js";
import { borrarUsuarioRegistrado, crearYRegistrarUsuario, logearUsuario, crearEquipo, borrarEquipo } from "../../utils/setup.js";
import path from "path";

// Atrapamos a Cloudinary antes de que haga nada
jest.mock('cloudinary', () => {
  // Traemos la herramienta nativa de Node para crear "tuberías" de datos (Streams) falsas
  const { Writable } = require('stream');

  return {
    v2: {
      config: jest.fn(),
      uploader: {
        // Multer llama a esta función pasándole opciones y un callback
        upload_stream: jest.fn((opciones, callback) => {
          // Le devolvemos un Stream falso que Multer pueda usar
          return new Writable({
            write(chunk, encoding, next) {
              next(); // Hacemos de cuenta que recibimos el pedacito de archivo y seguimos
            },
            final(cb) {
              // Cuando Multer termina de mandar todo, disparamos el éxito
              callback(null, {
                secure_url: 'https://res.cloudinary.com/demo/image/upload/fake-equipo.jpg',
                public_id: 'fake_id_123'
              });
              cb(); // Cerramos la tubería
            }
          });
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' })
      }
    }
  };
});

describe("Auth Integration Tests de equipos", () => {
    let usuarioRegistrado;
    let usuarioLogeado;
    beforeAll(async () => {

        await sequelize.sync({ force: true });
        usuarioRegistrado = await crearYRegistrarUsuario();
        usuarioLogeado = await logearUsuario(usuarioRegistrado);
        await cargarEquiposTest();
    });
    afterAll(async () => {
        if (usuarioRegistrado && usuarioRegistrado.id) {
            await borrarUsuarioRegistrado(usuarioRegistrado.id);
        }
        await sequelize.close();
    });

    describe("Obtener equipos por pagina y limite", () => {
        test("Deberia proveer una pagina de equipos a un usuario logeado", async () => {
            const response = await request(app).get("/equipos/general")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
            //No es null, y es efectivamente un array
            expect(response.body).not.toBeNull();
            expect(response.body).toHaveProperty("totalItems");
            expect(response.body).toHaveProperty("totalPages");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("data");
            expect(Array.isArray(response.body.data)).toBe(true);
            response.body.data.forEach(equipo => {
                expect(equipo).toEqual(
                    expect.objectContaining({
                        // El unico que es obligatorio
                        name: expect.any(String),

                        // Como ID y Founded pueden ser '66' o 66, chequeamos manualmente que no sea basura
                        id: cumpleCondicion(val => typeof val === "string" || typeof val === "number"),
                        founded: cumpleCondicion(val => typeof val === "string" || typeof val === "number" || val === null),


                        // Usamos nuestro helper 'optional(String)'
                        shortName: optional(String),
                        tla: optional(String),
                        crestUrl: optional(String),
                        address: optional(String),
                        phone: optional(String),
                        website: optional(String),
                        email: optional(String),
                        clubColors: optional(String),
                        venue: optional(String),
                        lastUpdated: optional(String),

                        //usamos lógica condicional
                        area: cumpleCondicion(val => {
                            if (val === null) return true; // Es válido si es null
                            // Si no es null, debe tener ID y Name
                            return typeof val === "object" &&
                                (typeof val.id === "number" || typeof val.id === "string") &&
                                typeof val.name === "string";
                        })
                    })
                );
            });

        });
        test("Funciona si se le envía una query", async () => {
            const response = await request(app).get("/equipos/general")
                .query({
                    q: "New",
                    limit: 5,
                    page: 1
                })
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
            //No es null, y es efectivamente un array
            expect(response.body).not.toBeNull();
            expect(response.body).toHaveProperty("totalItems");
            expect(response.body).toHaveProperty("totalPages");
            expect(response.body).toHaveProperty("currentPage");
            expect(response.body).toHaveProperty("data");
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        test("No deberia proveer equipos a un usuario que no esté logeado", async () => {
            const response = await request(app).get("/equipos/general");
            expect(response.statusCode).toBe(401);
        });
        test("Funciona por default si se le pasa mal el límite", async () => {
            const response = await request(app).get("/equipos/general")
                .query({
                    q: "New",
                    limit: "Pedro",
                    page: 1
                })
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
        });
        test("Funciona por default si se le pasa mal la página", async () => {
            const response = await request(app).get("/equipos/general")
                .query({
                    q: "New",
                    limit: 5,
                    page: "Uno"
                })
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
        });
        test("Retorna vacio ante una query inválida", async () => {
            const response = await request(app).get("/equipos/general")
                .query({
                    q: "boca juniors fulbo clu",
                    limit: 5,
                    page: 1
                })
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });
        test("Está blindada ante SQL inyections", async () => {
            /*Por la propia definición de sequelize que usa consultas parametrizadas */

            const sqlInjection = "' OR '1'='1' --";
            const response = await request(app).get("/equipos/general")
                .query({
                    q: sqlInjection,
                    limit: 5,
                    page: 1
                })
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
            //? Por que estos resultados?
            //Si efectivamente bypassearan nuestro comando, podrian obtener
            //a todos los equipos
            expect(response.body.data).toHaveLength(0);
            expect(response.body.totalItems).toBe(0);
        });
    });
    describe("Los usuarios normales...", () => {
        test("Pueden ver un equipo cualquiera", async () => {
            const response = await request(app).get("/equipos/66")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("id", 66);
            expect(response.body).toHaveProperty("name");

        });
        test("Pueden crear un equipo", async () => {
            const name = "boca juniors";
            const response = await crearEquipo(usuarioLogeado, name);
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty("name", name);
            await borrarEquipo(name);
        });
        test("Pueden crear un equipo subiendo una imagen", async () => {
            const name = "boca juniors2";
            const rutaImagen = path.resolve("test", "fixtures", "bocajuniors.jpg");
            const response = await crearEquipo(usuarioLogeado, name, rutaImagen);
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty("name", name);
            expect(response.body).toHaveProperty("crestUrl");
            await borrarEquipo(name);
        });
        test("Pueden modificar el equipo que crearon", async () => {
            const name = "boca juniors3";
            const nameMod = "river plate";
            const responseEquipo = await crearEquipo(usuarioLogeado, name);

            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: responseEquipo.body.id,
                    name: nameMod
                });
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("name", nameMod);
            await borrarEquipo(nameMod);
        });
        test("NO pueden modificar un equipo que no crearon", async () => {
            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: 66,
                    name: "Manchester United FC"
                }); //salen del set de datos de prueba
            expect(response.statusCode).toBe(403);
        });
        test("NO pueden eliminar un equipo que crearon", async () => {
            const name = "boca juniors4";
            const response = await crearEquipo(usuarioLogeado, name);
            expect(response.statusCode).toBe(201);
            const response2 = await request(app).delete("/equipos/borrar/" + response.body.id)
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: response.body.id,
                    name
                });
            expect(response2.statusCode).toBe(403);
            await borrarEquipo(name);
        });
        test("NO pueden eliminar un equipo que no crearon", async () => {
            const name = "Manchester United FC";
            const response2 = await request(app).delete("/equipos/borrar/66")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: 66,
                    name
                });
            expect(response2.statusCode).toBe(403);
            await borrarEquipo(name);
        });
        test("NO pueden crear un equipo sin nombre", async () => {
            const response = await request(app).post("/equipos/agregar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    crestUrl: "aca va"
                });
            expect(response.statusCode).toBe(400);
        });
        test("NO pueden subir un archivo que no sea una imágen", async () => {
            const name = "boca juniors5";
            const rutaPdf = path.resolve("test", "fixtures", "prueba.pdf");
            const response = await crearEquipo(usuarioLogeado, name, rutaPdf);
            expect(response.statusCode).toBe(400);
        });
        test("NO pueden subir más de una imágen", async () => {
            const rutaPdf = path.resolve("test", "fixtures", "prueba.pdf");
            const rutaPdf2 = path.resolve("test", "fixtures", "prueba_copy.pdf");
            const peticion = request(app)
                .post("/equipos/agregar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .field("name", "boca juniors6");
            peticion.attach("image", rutaPdf);
            peticion.attach("image", rutaPdf2);
            const response = await peticion;
            expect(response.statusCode).toBe(400);


        });
        test("NO pueden ver a un equipo inexistente", async () => {
            const response = await request(app).get("/equipos/567345")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`);
            expect(response.statusCode).toBe(404);
        });
        test("NO pueden modificar a un equipo inexistente", async () => {
            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: 567324,
                    name: "nameMod"
                });
            expect(response.statusCode).toBe(404);
        });
        test("NO pueden modificar a un equipo y borrarle el nombre", async () => {
            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${usuarioLogeado.token}`)
                .send({
                    id: 567324,
                    name: ""
                });
            expect(response.statusCode).toBe(404);
        });
    });
    describe("El administrador...", () => {
        let adminLogeado;
        beforeAll(async () => {
            const adminRegistrado = await crearYRegistrarUsuario("admin", "admin");
            adminLogeado = await logearUsuario(adminRegistrado);
        });

        afterAll(async () => {
            if (adminLogeado && adminLogeado.id) {
                await borrarUsuarioRegistrado(adminLogeado.id);
            }
        });

        test("Puede modificar un equipo que no creó", async () => {
            const name = "boca juniors";
            const response = await crearEquipo(usuarioLogeado, name);
            const responseAdmin = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${adminLogeado.token}`)
                .send({
                    id: response.body.id,
                    name: "name cambiado por el admin"
                });

            expect(responseAdmin.statusCode).toBe(200);
            await borrarEquipo("name cambiado por el admin");
        });
        test("Puede eliminar cualquier equipo", async () => {
            const name = "boca juniors";
            const response = await crearEquipo(usuarioLogeado, name);
            const responseAdmin = await request(app).delete("/equipos/borrar/" + response.body.id)
                .set("Authorization", `Bearer ${adminLogeado.token}`).send();
            expect(responseAdmin.statusCode).toBe(200);
        
        });
        test("NO puede ver a un equipo inexistente", async () => {
            const response = await request(app).get("/equipos/567345")
                .set("Authorization", `Bearer ${adminLogeado.token}`);
            expect(response.statusCode).toBe(404);
        });
        test("NO puede modificar a un equipo inexistente", async () => {
            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${adminLogeado.token}`)
                .send({
                    id: 567324,
                    crestUrl: "apa la papa"
                });
            expect(response.statusCode).toBe(404);
        });
        test("NO puede eliminar a un equipo inexistente", async () => {
            const response = await request(app).delete("/equipos/borrar/567345")
                .set("Authorization", `Bearer ${adminLogeado.token}`);
            expect(response.statusCode).toBe(404);
        });
                test("NO puede modificar a un equipo y borrarle el nombre", async () => {
            const response = await request(app).patch("/equipos/modificar")
                .set("Authorization", `Bearer ${adminLogeado.token}`)
                .send({
                    id: 567324,
                    name: ""
                });
            expect(response.statusCode).toBe(404);
        });
                test("NO pueden subir un archivo que no sea una imágen", async () => {
            const name = "boca juniors";
            const rutaPdf = path.resolve("test", "fixtures", "prueba.pdf");
            const response = await crearEquipo(adminLogeado, name, rutaPdf);
            expect(response.statusCode).toBe(400);
        });
        test("NO pueden subir más de una imágen", async () => {
            const rutaPdf = path.resolve("test", "fixtures", "prueba.pdf");
            const rutaPdf2 = path.resolve("test", "fixtures", "prueba_copy.pdf");
            const peticion = request(app)
                .post("/equipos/agregar")
                .set("Authorization", `Bearer ${adminLogeado.token}`)
                .field("name", "boca juniors");
            peticion.attach("image", rutaPdf);
            peticion.attach("image", rutaPdf2);
            const response = await peticion;
            expect(response.statusCode).toBe(400);


        });
    });
});
const optional = (tipo) => {
    return {
        asymmetricMatch: (actual) => actual === null || actual.constructor === tipo
    };
};
const cumpleCondicion = (validacion) => ({
    asymmetricMatch: (actual) => validacion(actual)
});