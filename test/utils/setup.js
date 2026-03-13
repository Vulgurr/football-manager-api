// eslint-disable-next-line
import { __dirname } from "../../src/config/dotenv.js";
import request from "supertest";
import app from "../../src/app.js";
import Usuario from "../../src/models/usuario.js";
import Equipo from "../../src/models/equipo.js";
import bcrypt from "bcrypt";
import path from "path";
import { cargaDesdeJSON } from "../../src/services/managerDatosSequelize.js";
//!IMPORTANTE
//Este const es el que define esencialmente el tiempo de todos los testeos.
//Acá no uso la variable del .env ya que realmente todos estos datos son falsos
//y no me importa la seguridad, como si me importaría en producción
//El minimo es 4, poner 1, 2 o 3 puede hacer o que bien bcrypt te lo hardcodee a 4
// o que tire un error
const CANTIDAD_RONDAS = 4;
export async function crearYRegistrarUsuario(letrasMail="", rol="usuario") {

    const password = "pAssword123!";
    const passHash = await bcrypt.hash(password, CANTIDAD_RONDAS);
    const response = await Usuario.create({
        name: "pedro perez",
        email: "pedro@perez"+letrasMail+".com",
        hashPassword: passHash,
        rol,
    });
    const res = {
        name: response.name,
        password,
        email: response.email,
        id: response.id,
        rol: rol
    };
    return res;
}

export async function logearUsuario(usuario) {
    const response = await request(app).post("/auth/login").send({
        email: usuario.email,
        password: usuario.password
    });
    const res = {
        name: usuario.name,
        password: usuario.password,
        email:usuario.email,
        rol:usuario.rol,
        id: response.body.user.id,
        token: response.body.token
    };
    return res;
}

export async function borrarUsuarioRegistrado(idBuscado) {
    await Usuario.destroy({
        where: { id: idBuscado }
    });
}

export async function crearEquipo(usuarioLogeado, nombreEquipo, rutaImagen = null) {
    //!NO va el await aca!
    const peticion = request(app)
        .post("/equipos/agregar")
        .set("Authorization", `Bearer ${usuarioLogeado.token}`)
        // Los campos de texto se envían con .field() cuando hay archivos de por medio
        .field("name", nombreEquipo);
        //Para poner varios campos le tenes que pones .field, .field y asi
        //o si lo queres encapsular en un objeto, .field y el objeto

    if (rutaImagen) {
        // .attach(nombre_del_campo, ruta_al_archivo)
        peticion.attach("image", rutaImagen);
        //es image y no crestURL porque este es el nombre que tiene para multer
    }
    //Recien aca resolvemos la promesa, porque sino no le hubieramos podido attachear los campos

    return await peticion;
}

export async function borrarEquipo(nameBuscado){
    await Equipo.destroy({
        where: { name: nameBuscado }
    });
}

export async function cargarEquiposTest() {
    const rutaJSON = path.resolve("test","fixtures", "equiposTest.json");
    await cargaDesdeJSON(rutaJSON);
}