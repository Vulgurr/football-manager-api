export const limpiarDato = (dato) => {
        if (dato === "" || dato === "null" || dato === undefined) return null;
        return dato;
    };

export function esPassValida(pass) {
    // 1. Validación de Tipo (Corregido isNaN)
    if (typeof pass !== "string" || pass === "") {
        return false;
    }

    const validaciones = {
        tieneMayus: /[A-Z]/,
        tieneMinus: /[a-z]/,
        tieneNumero: /[0-9]/,
        tieneCaracterEspecial: /\W/, // \W busca cualquier NO-alfanumérico 
        
        //tienePatronPredecible:/^[A-Z][a-z]+[0-9]+[\W]+$/
        //Esa seria la regex normal, pero por como quiero armar el testing la voy a negar
        // Evita estructuras tipo: "Boca123!" (Mayus + Minus + Num + Simbolo en orden)
        //BocaJuniors123! funcionaría
        tienePatronPredecible:/^(?![A-Z][a-z]+[0-9]+[\W]+$).*/
    };

    const keys = Object.keys(validaciones);
    
    for (const k of keys) {
        const regex = validaciones[k];
        if (!regex.test(pass)) {
            // Opcionalmente podria retornar donde falló con return k
            return false; 
        }
    }
    // Si sobrevivió al bucle, es válida
    return true;
}

export function esMailValido(email) {
    if (typeof email !== "string" || email === "") {
        return false;
    }
    const validacionesConRegex={
        arroba: /@/,
        masArrobas: /^[^@]*@[^@]*$/, //N caracteres no arroba, arroba y N caracteres no arroba
        dosPuntos: /^(?![^.]*\.\.).*$/,
        parteLocalPuntoInicio: /^(?!\.).*/,
        parteLocalPuntoFinal: /^(?!.*\.@).*$/, //Desde el inicio busco N caracteres hasta un punto, el propio punto y verifico el arroba
        //Si no se cumple esta regex la doy como true
        "punto-despues-del-arroba":/@.*\./,
        "termina-en-punto":/[^.]$/,
        parteLocal: /^[A-Za-z0-9_\-.+]+@/, //Acepta letras, numeros, _, -, + y .
        dominio: /@[A-Za-z0-9]/, //Solo acepta letras y numeros
        largoDominioCorto: /@[A-Za-z0-9]{2,}/
    };

    const keys= Object.keys(validacionesConRegex);
    for (const k of keys) {
        const regex = validacionesConRegex[k];
        if (!regex.test(email)) {
            // Opcional: Podrías devolver qué regla falló: return k;
            return false; 
        }
    }
    return true;
}

export function esNombreValido(name) {
    if (typeof name !== "string") return false;
    const nombreLimpio = name.trim(); //le saco los espacios
    if (nombreLimpio.length < 2) return false;
    return /^[a-zA-Z\sáéíóú]+$/.test(name);
    //Verifica que solo tenga letras y espacios
}

export const extraerPublicIdDeUrl = (url) => {
    if (!url) return null;

    // Esta magia busca la palabra "upload/", ignora la versión (v seguido de números) 
    // y captura todo lo demás hasta encontrar el punto de la extensión (.jpg, .png)
    const match = url.match(/upload\/(?:v\d+\/)?([^.]+)/);
    
    // Si encuentra coincidencia, devuelve la captura (el public_id puro)
    return match ? match[1] : null;
};