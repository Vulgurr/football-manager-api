import * as datos from "../services/managerDatosSequelize.js";

import { limpiarDato } from "../utils/helpers.js";

export async function getGeneral(req, res, next){
  try {
    const {limit, page, offset, query} = req.paginacion;
    //"q" es el nombre que por lo general recibe la query para buscar
    const equipo = await datos.obtenerDatos(page, limit, offset, query);
    res.status(200).json(equipo);
  } catch(error) {
    next(error);
  }
}

export async function getEquipo (req, res, next){
  try {
    const id = req.params.id;
    const equipo = await datos.obtenerEquipo(id);
    res.status(200).json(equipo);

  } catch(error) {
    next(error);
  }
}

export async function  borrarEquipo (req, res, next){
    try {
      if (req.user.rol !== "admin")
        throw new Error("ACCESO_DENEGADO");
    const id = req.params.id;
    await datos.eliminarEquipo(id);
    res.status(200).send("Equipo eliminado correctamente");

  } catch(error) {
    next(error);
  }
}

export async function modificarEquipo (req, res, next){
  try {
    const datosFormulario = req.body;
    const archivo = req.file;
    const equipoAModificar = await datos.obtenerEquipo(datosFormulario.id);
    const idCreador=equipoAModificar.creadoPor;

    if (req.user.id !== idCreador && req.user.rol !== "admin")
      throw new Error("ACCESO_DENEGADO");

    // Si mandaron foto nueva, la usamos. Si no, tenemos que asegurarnos 
    // de NO sobrescribir la vieja con null. 

    let rutaImagenNueva = null;
    if (archivo) {
      // Cloudinary ya nos da la URL completa (https://res.cloudinary.com/...)
      rutaImagenNueva = archivo.path;
    }
    const equipoActualizado = {
      name: datosFormulario.name, // Este es obligatorio, lo dejamos así
      
      // SANITIZAMOS LOS OPCIONALES
      /*Sequelize se rompe si le llega "" o undefined, asi que hay que convertir todo a null. */
      shortName: limpiarDato(datosFormulario.shortName),
      tla: limpiarDato(datosFormulario.tla),
      address: limpiarDato(datosFormulario.address),
      founded: limpiarDato(datosFormulario.founded),      
      email: limpiarDato(datosFormulario.email),
      website: limpiarDato(datosFormulario.website),
      venue: limpiarDato(datosFormulario.venue),
      clubColors: limpiarDato(datosFormulario.clubColors),
      area: JSON.parse(datosFormulario.area || "{}"), // Parseamos el area
      lastUpdated: new Date() // Actualizamos la fecha
    };
    //Este spread operator funciona porque desde el frontend recibo un par clave-valor,
    //no es que el spread operator sea listo.    
    // Solo agregamos la propiedad crestUrl si efectivamente hay una imagen nueva.
    // Sino dejamos que 'actualizarEquipo' mantenga la vieja, o la pasamos explícita si el front la mandó
    if (rutaImagenNueva) {
      equipoActualizado.crestUrl = rutaImagenNueva;
    }
    // Convertimos el ID a número porque en FormData viaja como texto "123"
    const idBusqueda = Number(datosFormulario.id);

    const resultado = await datos.actualizarEquipo(idBusqueda, equipoActualizado);

    res.status(200).json(resultado);

  } catch (error) {
    next(error);
}
}

export async function agregarEquipo (req, res, next) {
  try {
    const datosFormulario = req.body; // aca llega el texto (name, area, etc.)
    const archivo = req.file;         // aca llega la imagen

    const rutaImagen = archivo ? archivo.path : null;

    let areaParsed = {};
    try {
      if (typeof datosFormulario.area === "string") {
        // Si viene de FormData (es un string), lo convertimos a objeto
        areaParsed = JSON.parse(datosFormulario.area);
      } else if (typeof datosFormulario.area === "object") {
        // Si viene de JSON puro (ya es objeto), lo usamos directo
        areaParsed = datosFormulario.area;
      }
    } catch (err) {
      console.error("Error parseando area en POST:", err);
      // Si falla, areaParsed queda como {} para no romper todo
    }
    // Creamos el objeto final para guardar
    const nuevoEquipo = {
      name: datosFormulario.name,
      shortName: limpiarDato(datosFormulario.shortName),
      tla: limpiarDato(datosFormulario.tla),
      address: limpiarDato(datosFormulario.address),
      founded: limpiarDato(datosFormulario.founded),      
      email: limpiarDato(datosFormulario.email),
      website: limpiarDato(datosFormulario.website),
      venue: limpiarDato(datosFormulario.venue),
      clubColors: limpiarDato(datosFormulario.clubColors),
      area: areaParsed,
      crestUrl: rutaImagen,
      creadoPor: req.user.id
    };

    const equipoCreado = await datos.agregarEquipo(nuevoEquipo);
    res.status(201).json(equipoCreado);

  } catch (error) {
    next(error);
  }
}