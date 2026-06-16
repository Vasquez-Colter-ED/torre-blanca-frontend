import { useState, useRef } from 'react'
import { leerVoucher } from '../utils/voucherOCR'
import './EscanerVoucher.css'

// Botón que abre la cámara (o galería) del dispositivo, lee la foto del
// voucher con OCR y devuelve los datos detectados mediante onDatosDetectados.
// La foto se procesa solo en el navegador y se descarta de inmediato.
export default function EscanerVoucher({ onDatosDetectados }) {
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const inputRef = useRef(null)

  const manejarArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setProcesando(true)
    setMensaje('')
    try {
      const datos = await leerVoucher(archivo)
      const detectados = []
      if (datos.monto) detectados.push('monto')
      if (datos.numeroOperacion) detectados.push('N° de operación')
      if (datos.banco) detectados.push('banco')

      setMensaje(detectados.length > 0
        ? 'Detectamos ' + detectados.join(', ') + '. Revisa los campos antes de guardar.'
        : 'No pudimos detectar los datos automáticamente. Complétalos manualmente.')

      onDatosDetectados(datos)
    } catch {
      setMensaje('No se pudo leer la imagen. Completa los datos manualmente.')
    } finally {
      setProcesando(false)
      e.target.value = '' // permite volver a intentar con la misma foto si hace falta
    }
  }

  return (
    <div className="escaner-voucher">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={manejarArchivo}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn-escanear"
        onClick={() => inputRef.current.click()}
        disabled={procesando}
      >
        {procesando ? 'Leyendo voucher...' : '📷 Leer voucher con foto'}
      </button>
      {mensaje && <p className="escaner-mensaje">{mensaje}</p>}
    </div>
  )
}
