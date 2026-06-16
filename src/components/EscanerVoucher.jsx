import { useState, useRef, useEffect } from 'react'
import { leerVoucher } from '../utils/voucherOCR'
import './EscanerVoucher.css'

// Dos formas de obtener la foto del voucher:
// 1) Cámara propia dentro de la app (getUserMedia), 100% confiable en
//    cualquier navegador, no depende de que el sistema abra la app de
//    cámara nativa.
// 2) Selector de galería/explorador normal del navegador.
// La imagen se procesa solo en el navegador con OCR y se descarta de
// inmediato, nunca se sube ni se guarda.
export default function EscanerVoucher({ onDatosDetectados }) {
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorCamara, setErrorCamara] = useState('')
  const [camaraAbierta, setCamaraAbierta] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const inputGaleriaRef = useRef(null)

  // Por seguridad: si el componente se desmonta con la cámara abierta,
  // apaga la cámara para no dejarla encendida de fondo.
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const procesarImagen = async (imagen) => {
    setProcesando(true)
    setMensaje('')
    try {
      const datos = await leerVoucher(imagen)
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

  const manejarCambioGaleria = (e) => {
    const archivo = e.target.files[0]
    if (archivo) procesarImagen(archivo)
    e.target.value = ''
  }

  const abrirCamara = async () => {
    setErrorCamara('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCamaraAbierta(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 0)
    } catch {
      setErrorCamara('No se pudo acceder a la cámara. Revisa los permisos del navegador o usa "Elegir de galería".')
    }
  }

  const cerrarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCamaraAbierta(false)
  }

  const capturarFoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    cerrarCamara()
    procesarImagen(canvas) // Tesseract.js acepta un canvas directamente
  }

  return (
    <div className="escaner-voucher">
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        onChange={manejarCambioGaleria}
        style={{ display: 'none' }}
      />

      <div className="escaner-botones">
        <button type="button" className="btn-escanear" onClick={abrirCamara} disabled={procesando}>
          {procesando ? 'Leyendo...' : '📷 Tomar foto'}
        </button>
        <button type="button" className="btn-escanear" onClick={() => inputGaleriaRef.current.click()} disabled={procesando}>
          {procesando ? 'Leyendo...' : '🖼️ Elegir de galería'}
        </button>
      </div>

      {errorCamara && <p className="escaner-mensaje escaner-error">{errorCamara}</p>}
      {mensaje && <p className="escaner-mensaje">{mensaje}</p>}

      {camaraAbierta && (
        <div className="camara-overlay">
          <video ref={videoRef} autoPlay playsInline muted className="camara-video" />
          <div className="camara-controles">
            <button type="button" className="btn-camara-cancelar" onClick={cerrarCamara}>Cancelar</button>
            <button type="button" className="btn-camara-capturar" onClick={capturarFoto}>📸 Capturar</button>
          </div>
        </div>
      )}
    </div>
  )
}
