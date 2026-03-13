import Equipo from "../models/equipo.js";
import fs from "fs/promises";
import { UniqueConstraintError, Op } from "sequelize"; // Para manejar errores
import { extraerPublicIdDeUrl } from "../utils/helpers.js";
import { v2 as cloudinary } from "cloudinary";

// OBTENER TODOS (SELECT *)
export async function obtenerDatos(page = 1, limit = 10, offset, queryABuscar) {
    // No hace falta parsear 'area', Sequelize ya te lo da como objeto JS
    const condicionWhere = {};
    // Si el usuario escribió algo en el buscador (queryBusqueda no es vacío ni null)
    if (queryABuscar) {
        condicionWhere.name = {
            // Op.iLike es exclusivo de Postgres. Significa "Case Insensitive Like"
            // Se utiliza iLike por compatibilidad nativa con PostgreSQL para búsquedas case-insensitive.
            [Op.iLike]: `%${queryABuscar}%`
        };
    }
    const { count, rows } = await Equipo.findAndCountAll({
        where: condicionWhere,
        limit: limit,
        offset: offset,
        order: [["id", "ASC"]] // esto es como order by id asc
    });
    /*Esta consulta siempre va a contar el total de equipos que haya, pero hasta no tener millones de equipos
    no vale la pena hacer una optimización de esta query */

    const res = {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows // Aca van los N equipos de esta página
    };
    return res;
}

// OBTENER UNO (SELECT * from x WHERE ID)
export async function obtenerEquipo(idBuscado) {
    // findByPk = Find By Primary Key
    const equipo = await Equipo.findByPk(idBuscado);

    if (!equipo) {
        throw new Error("ID_NO_ENCONTRADO");
    }

    return equipo;
}

// AGREGAR (INSERT)
export async function agregarEquipo(datosEquipo) {
    try {
        // Preparamos los datos
        // Sequelize maneja los nulls automáticos si no enviamos el campo,
        // pero aseguramos la fecha de actualización.
        const nuevoEquipo = {
            ...datosEquipo,
            lastUpdated: new Date(), // Usamos objeto Date real, Postgres lo entiende
            // area: ya viene como objeto, NO hace falta stringify
        };

        // .create inserta y devuelve el objeto creado con su nuevo ID
        const resultado = await Equipo.create(nuevoEquipo);

        return resultado;

    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            throw new Error("EQUIPO_DUPLICADO");
        }
        throw error;
    }
}

// ELIMINAR (DELETE)
export async function eliminarEquipo(idBuscado) {
    
    const equipo = await Equipo.findByPk(idBuscado);
    if (!equipo) {
        throw new Error("ID_NO_ENCONTRADO");
    }
    if (equipo.crestUrl) {
        const publicId = extraerPublicIdDeUrl(equipo.crestUrl);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    }
    // .destroy devuelve cuántas filas borró. Ya no hago un chequeo de filas === 0 
    //porque lo hago arriba con el get
    await Equipo.destroy({
        where: { id: idBuscado }
    });

    return true;
}

// ACTUALIZAR (UPDATE)
export async function actualizarEquipo(id, datosActualizados) {
    try {
        // Actualizamos la fecha
        const datosParaGuardar = {
            ...datosActualizados,
            lastUpdated: new Date()
        };

        // .update devuelve un array: [cantidadDeFilasAfectadas]
        const [filasAfectadas] = await Equipo.update(datosParaGuardar, {
            where: { id: id }
        });

        if (filasAfectadas === 0) {
            throw new Error("ID_NO_ENCONTRADO");
        }

        // Sequelize update no devuelve el objeto actualizado por defecto (en todas las DBs),
        // así que lo devolvemos nosotros mezclando el ID con los datos nuevos.
        return { id, ...datosParaGuardar };

    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            throw new Error("EQUIPO_DUPLICADO");
        }
        throw error;
    }
}

// Reset total
export async function cargaDesdeJSON(rutaJSON) {
    let validos = [];
    let erroneos = [];
    
    // Verificamos id y nombre
    const idsProcesados = new Set();
    const nombresProcesados = new Set(); 

    try {
        const datosRaw = await fs.readFile(rutaJSON, "utf-8");
        const datosJSON = JSON.parse(datosRaw);

        for (const equipo of datosJSON) {            
            const idNumerico = Number(equipo.id);
            const nombreEquipo = equipo.name;

            
            if (idsProcesados.has(idNumerico)) {
                erroneos.push({ equipo: nombreEquipo, error: `ID duplicado: ${idNumerico}` });
                continue;
            }
            if (nombresProcesados.has(nombreEquipo)) {
                erroneos.push({ equipo: nombreEquipo, error: `Nombre duplicado: ${nombreEquipo}` });
                continue;
            }

            // LIMPIEZA Y MAPEO
            // Convertimos el objeto 'area' del JSON a 'areaId' de la DB
            if (equipo.area && equipo.area.id) {
                equipo.areaId = equipo.area.id;
            }

            equipo.id = idNumerico;
            
            // Lógica de fechas
            const fechaValida = equipo.lastUpdated && !isNaN(Date.parse(equipo.lastUpdated));
            equipo.lastUpdated = fechaValida ? equipo.lastUpdated : new Date();

            // Null checks
            equipo.founded = (equipo.founded === "" || equipo.founded === null) ? null : equipo.founded;
            equipo.creadoPor = (equipo.creadoPor === "" || !equipo.creadoPor) ? 0 : equipo.creadoPor;

            // CONSTRUCCIÓN
            const instancia = Equipo.build(equipo);

            try {
                // validate() puede fallar si chequea contra la DB no truncada
                await instancia.validate(); 

                // Guardamos dataValues, NO el objeto JSON crudo
                validos.push(instancia.dataValues); 
                
                // Registramos como procesado
                idsProcesados.add(idNumerico);
                nombresProcesados.add(nombreEquipo);

            } catch (error) {
                erroneos.push({
                    equipo: equipo.name,
                    error: error.message
                });
            }
        };

        // --- FASE DE BASE DE DATOS ---
        
        if (validos.length === 0) {
            console.error("Errores encontrados:", erroneos); // Imprime los errores para ver qué pasó
            throw new Error("Abortando: No quedaron registros válidos para insertar.");
        }

        console.log(`Insertando ${validos.length} equipos...`);
        
        // validate: false para que sea rápido y no chequee unique contra la DB (ya lo hicimos nosotros)
        await Equipo.bulkCreate(validos, { validate: false }); 

        console.log("Carga masiva finalizada con éxito");

    } catch (error) {
        console.error("Error FATAL en la carga:", error);
        // Si es error de DB, esto te dirá exactamente qué campo falló (ID, Name, TLA, etc.)
        if (error.original) console.error("Detalle SQL:", error.original.message);
    }
}