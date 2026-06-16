// Funciones de filtrado para evitar caracteres especiales en los inputs
// (requerimiento del docente). Cada función limpia el valor mientras
// el usuario escribe, en vez de mostrar el error después.

// Letras (con tildes y ñ), espacios y guión — nombres y apellidos
export const soloLetras = (valor) => valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]/g, '')

// Solo dígitos — DNI, teléfono
export const soloNumeros = (valor) => valor.replace(/[^0-9]/g, '')

// Letras, números y espacios — descripciones, observaciones, N° operación (estricto)
export const textoLibreEstricto = (valor) => valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s]/g, '')

// Validación de formato de email (no se filtra mientras escribe porque
// el @ y el punto son necesarios, se valida recién al enviar el formulario)
export const esEmailValido = (valor) => /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(valor)
