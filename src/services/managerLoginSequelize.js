import { UniqueConstraintError } from "sequelize"; // Para manejar errores
import bcrypt from "bcrypt";
import Usuario from "../models/usuario.js";
const CANTIDAD_RONDAS = Number(process.env.BCRYPT_ROUNDS);

export async function registrarUsuario(usuario) {
    try {
        const passHasheada = await bcrypt.hash(usuario.password, CANTIDAD_RONDAS);
        const usuarioNuevo = {
            name: usuario.name,
            hashPassword: passHasheada,
            email: usuario.email
        };
        const resultado = await Usuario.create(usuarioNuevo);
        return {
            name: resultado.name,
            id: resultado.id,
            email: resultado.email,
            rol: resultado.rol
        };
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            throw new Error("EMAIL_DUPLICADO");
        }
        throw error;
    }
}
export async function autenticarUsuario(usuario) {

    const usuarioConsulta = await Usuario.findOne({
        where: {
            email: usuario.email
        }
    });
    if (!usuarioConsulta) throw new Error("CREDENCIALES_INVALIDAS");
    if (!usuarioConsulta.activo) throw new Error("USUARIO_INACTIVO"); //si esta baneado
    const esValida = await bcrypt.compare(usuario.password, usuarioConsulta.hashPassword);

    if (!esValida) throw new Error("CREDENCIALES_INVALIDAS");
    return ({
        id: usuarioConsulta.id,
        email: usuarioConsulta.email,
        name: usuarioConsulta.name,
        rol: usuarioConsulta.rol
    });
}

export async function cambiarPassword(idUsuario, passVieja, passNueva) {
    if (passVieja === passNueva) {
        throw new Error("MISMA_PASSWORD"); 
    }
    const usuario = await Usuario.findByPk(idUsuario);
    if (!usuario) throw new Error("USUARIO_INEXISTENTE");
    //Aunque solo le pida un elemento, devuelve un objeto
    const esValida = await bcrypt.compare(passVieja, usuario.hashPassword);
    if (!esValida) throw new Error("PASS_INCORRECTA");
    //Para este punto la pass vieja es correcta, el usuario existe y la
    //nueva contraseña es valida
    const passNuevaHasheada = await bcrypt.hash(passNueva, CANTIDAD_RONDAS);
    await Usuario.update({ hashPassword: passNuevaHasheada }, {
        where: { id: idUsuario }
    });
    return "Contraseña cambiada exitosamente";
}

export async function cambiarEmail(idUsuario, password, nuevoEmail) {

    const usuario = await Usuario.findByPk(idUsuario);
    if (!usuario) throw new Error("USUARIO_INEXISTENTE");
    if (usuario.email === nuevoEmail) {
        throw new Error("MISMO_EMAIL"); 
    }
    const esValida = await bcrypt.compare(password, usuario.hashPassword);
    if (!esValida) throw new Error("PASS_INCORRECTA");
    //Aca no hago un spread operator porque el objeto sequelize que me devuelve
    //la consulta tiene un monton de cosas, lo que lo hace ineficiente.
    try {
        await Usuario.update(
            { email: nuevoEmail },
            { where: { id: idUsuario } }
        );
        return { mensaje: "Email actualizado correctamente" };
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            throw new Error("EMAIL_DUPLICADO");
        }
        throw error;
    }
}

export async function resetearTablaUsuarios() {
    try {

        await Usuario.destroy({
            truncate: true,
            cascade: false,      
            restartIdentity: true
        });

        console.log("Tabla Usuarios reseteada (IDs reiniciados)");
    } catch (error) {
        console.error("Error al resetear usuarios:", error);
        throw error;
    }
}
export async function crearAdmin() {
    const usuario = await Usuario.findOne({
        where: {
            rol: "admin"
        }
    });
    if (!usuario) {
        //No hay admin
        const passNormal = "BocaJuniors123!";
        const passHasheada = await bcrypt.hash(passNormal, CANTIDAD_RONDAS);
        const usuarioNuevo = {
            name: "admin",
            hashPassword: passHasheada,
            email: "admin@admin.com",
            rol: "admin"
        };
        const resultado = await Usuario.create(usuarioNuevo);
        console.log("Admin creado!!");
        return resultado;

    }
}

export async function getUsuarioPorID(id) {
    const usuario = await Usuario.findOne({
        where: {
            id: id,
        }
    });
    if (!usuario) throw new Error("USUARIO_INEXISTENTE");
    return usuario;
}

export async function incrementarTokenVersion(id) {
    // el método increment de Sequelize es atómico 
    await Usuario.increment(
        "tokenVersion",
        { by: 1, where: { id: id } }
    );
    const usuarioActualizado = await Usuario.findByPk(id);
    //El return de increment no es el objeto usuario como tal sino que es
    //otra cosa, por eso hay que hacer este find
    return usuarioActualizado;
}
