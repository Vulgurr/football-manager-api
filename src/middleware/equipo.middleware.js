const LIMITE_PAGINACION = 10;
const LIMITE_MAXIMO_PAGINACION = 50; //Medida de seguridad
export function paginar(req, res, next) {
    let { page, limit, q } = req.query;

    // Convertimos a entero. Si falla o es < 1, usamos valores default.
    //Opto por esta solución por temas de diseño en vez de tirar un error 400
    const paginaActual = Math.max(1, parseInt(page) || 1);
    const limite = Math.max(1, parseInt(limit) || LIMITE_PAGINACION);
    
    // Tope máximo por seguridad
    const limiteSeguro = Math.min(LIMITE_MAXIMO_PAGINACION, limite); 
    const offset = (paginaActual - 1) * limiteSeguro;

    req.paginacion = {
        limit: limiteSeguro,
        offset: offset,
        page: paginaActual,
        query:q
    };
    //Este req lo va a usar el controlador final

    next();
}
