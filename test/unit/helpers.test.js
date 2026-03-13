// tests/unit/helpers.test.js
import { esMailValido, esNombreValido, esPassValida } from "../../src/utils/helpers";

describe("Validación de Email (esMailValido)", () => {

    // --- CASOS FELICES ---
    test("Debería aceptar un email estándar", () => {
        expect(esMailValido("usuario@gmail.com")).toBe(true);
    });

    test("Debería aceptar email con puntos y guiones", () => {
        expect(esMailValido("nombre.apellido-123@empresa.tech")).toBe(true);
    });

    // --- CASOS TRISTES---

    test("Debería rechazar si no tiene arroba", () => {
        expect(esMailValido("usuariogmail.com")).toBe(false); 
    });

    test("Debería rechazar si tiene dos arrobas (masArrobas)", () => {
        expect(esMailValido("usuario@@gmail.com")).toBe(false);
        expect(esMailValido("u@suario@gmail.com")).toBe(false);
    });

    test("Debería rechazar puntos consecutivos (dosPuntos)", () => {
        expect(esMailValido("usuario..apellido@gmail.com")).toBe(false);
    });

    test("Debería rechazar si empieza con punto (parteLocalPuntoInicio)", () => {
        expect(esMailValido(".usuario@gmail.com")).toBe(false);
    });

    test("Debería rechazar si el punto está pegado al arroba (parteLocalPuntoFinal)", () => {
        expect(esMailValido("usuario.@gmail.com")).toBe(false);
    });
    
    test("Debería rechazar si no hay punto después del arroba", () => {
        expect(esMailValido("usuario@localhost")).toBe(false); // Tu regla pide punto en dominio
    });

    test("Debería rechazar si termina en punto", () => {
        expect(esMailValido("usuario@gmail.com.")).toBe(false);
    });
});

describe("Validación de Password (esPassValida)", () => {

    // --- CASOS FELICES ---
    test("Debería aceptar una contraseña segura estándar", () => {
        expect(esPassValida("a123BVX6!")).toBe(true);
    });

    // --- CASOS TRISTES ---

    test("Debería rechazar si no tiene numeros", () => {
        expect(esPassValida("ContraValida!")).toBe(false); 
    });

    test("Debería rechazar si no tiene signos especiales", () => {
        expect(esPassValida("ContraValida11")).toBe(false); 
    });

    test("Debería rechazar si no tiene minusculas", () => {
        expect(esPassValida("AGUANTEBOCA1!")).toBe(false); 
    });

    test("Debería rechazar si no tiene mayusculas", () => {
        expect(esPassValida("vivariver1!")).toBe(false); 
    });

    test("Debería rechazar si la contraseña es null", () => {
        expect(esPassValida(null)).toBe(false);
    });
    
    test("Debería rechazar si la contraseña es undefined", () => {
        expect(esPassValida(undefined)).toBe(false);
    });

    test("Debería rechazar si la contraseña es string vacio", () => {
        expect(esPassValida("")).toBe(false);
    });
    test("Debería rechazar si la contraseña tiene un valor predecible", () => {
        expect(esPassValida("Bocajuniors123!")).toBe(false);
    });
});

describe("Validación de Password (esPassValida)", () => {

    // --- CASOS FELICES ---
    test("Debería aceptar un nombre común", () => {
        expect(esNombreValido("Ian")).toBe(true);
    });

    test("Debería aceptar un nombre común con acentos", () => {
        expect(esNombreValido("Tomás")).toBe(true);
    });

    test("Debería aceptar un nombre común con espacios", () => {
        expect(esNombreValido("Juan Pablo")).toBe(true);
    });

    // --- CASOS TRISTES ---

    test("Debería rechazar un nombre común con símbolos no caracteres ni espacios", () => {
        expect(esNombreValido("123")).toBe(false);
    });

    test("Debería rechazar string vacío", () => {
        expect(esNombreValido("")).toBe(false);
    });

    test("Debería rechazar un solo caracter", () => {
        expect(esNombreValido("a")).toBe(false);
    });
    test("Debería rechazar null", () => {
        expect(esNombreValido(null)).toBe(false);
    });
    test("Debería rechazar undefined", () => {
        expect(esNombreValido(undefined)).toBe(false);
    });
});