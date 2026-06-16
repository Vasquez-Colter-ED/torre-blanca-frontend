import { useState, useRef } from 'react'
import { leerVoucher } from '../utils/voucherOCR'
import './EscanerVoucher.css'

// Dos formas de obtener la foto del voucher: tomarla directo con la cámara
// o elegirla de la galería/explorador de archivos. La imagen se procesa
// solo en el navegador con OCR y se descarta de inmediato, nunca se sube.
export default function EscanerVoucher({ onDatosDetectados }) {
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const inputCamaraRef = useRef(null)
  const inputGaleriaRef = useRef(null)

  const procesarArchivo = async (archivo) => {
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
    }
  }

  const manejarCambio = (e) => {
    const archivo = e.target.files[0]
    procesarArchivo(archivo)
    e.target.value = '' // permite volver a elegir la misma foto si hace falta
  }

  return (
    <div className="escaner-voucher">
      {/* capture="environment" obliga a abrir la cámara directamente en celulares */}
      <input
        ref={inputCamaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={manejarCambio}
        style={{ display: 'none' }}
      />
      {/* sin "capture" abre siempre la galería / explorador de archivos */}
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        onChange={manejarCambio}
        style={{ display: 'none' }}
      />

      <div className="escaner-botones">
        <button
          type="button"
          className="btn-escanear"
          onClick={() => inputCamaraRef.current.click()}
          disabled={procesando}
        >
          {procesando ? 'Leyendo...' : '📷 Tomar foto'}
        </button>
        <button
          type="button"
          className="btn-escanear"
          onClick={() => inputGaleriaRef.current.click()}
          disabled={procesando}
        >
          {procesando ? 'Leyendo...' : '🖼️ Elegir de galería'}
        </button>
      </div>

      {mensaje && <p className="escaner-mensaje">{mensaje}</p>}
    </div>
  )
}
