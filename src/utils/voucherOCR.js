// Lee una foto de voucher (transferencia, depósito o Plin) con Tesseract.js
// (100% en el navegador, sin costo, sin enviar la imagen a ningún servidor)
// y extrae monto, número de operación y banco con expresiones regulares.
// La imagen NUNCA se sube ni se guarda — solo se procesa en memoria.

import Tesseract from 'tesseract.js'

const BANCOS_CONOCIDOS = [
  'BCP', 'Interbank', 'BBVA', 'Scotiabank', 'Banco de la Nación',
  'Banco Pichincha', 'Banco Falabella', 'Banco Ripley',
  'Caja Piura', 'Caja Arequipa', 'Caja Trujillo', 'Yape', 'Plin'
]

export async function leerVoucher(imageFile) {
  const resultado = await Tesseract.recognize(imageFile, 'spa', {
    logger: () => {}, // silencia el progreso en consola
  })
  const texto = resultado.data.text || ''

  return {
    textoCrudo: texto,
    monto: extraerMonto(texto),
    numeroOperacion: extraerNumeroOperacion(texto),
    banco: extraerBanco(texto),
  }
}

function extraerMonto(texto) {
  // Prioridad 1: número que aparece cerca de la palabra "monto" o "total"
  let match = texto.match(/(?:monto|total)[^\d]{0,15}S\/\.?\s*(\d{1,5}(?:[.,]\d{2})?)/i)
  if (match) return match[1].replace(',', '.')

  // Prioridad 2: cualquier número precedido por el símbolo S/
  match = texto.match(/S\/\.?\s*(\d{1,5}(?:[.,]\d{2})?)/i)
  if (match) return match[1].replace(',', '.')

  return null
}

function extraerNumeroOperacion(texto) {
  let match = texto.match(/operaci[oó]n[^\d]{0,20}(\d{4,15})/i)
  if (match) return match[1]

  match = texto.match(/c[oó]digo[^\d]{0,20}(\d{4,15})/i)
  if (match) return match[1]

  match = texto.match(/n[uú]mero[^\d]{0,20}(\d{4,15})/i)
  if (match) return match[1]

  return null
}

function extraerBanco(texto) {
  const textoUpper = texto.toUpperCase()
  for (const banco of BANCOS_CONOCIDOS) {
    if (textoUpper.includes(banco.toUpperCase())) return banco
  }
  return null
}
