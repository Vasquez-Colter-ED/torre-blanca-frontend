import { useState, useRef } from 'react'
import './SubirFoto.css'

const CLOUD_NAME   = 'diyzifgw6'
const UPLOAD_PRESET = 'torre-blanca-vouchers'

export default function SubirFoto({ onSubida, obligatorio = false, label = 'Foto del comprobante' }) {
  const [preview,   setPreview]   = useState(null)
  const [subiendo,  setSubiendo]  = useState(false)
  const [error,     setError]     = useState('')
  const [url,       setUrl]       = useState('')
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('La imagen no puede superar 10 MB'); return }

    setError(''); setSubiendo(true)
    setPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('file',          file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder',        'vouchers')

    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.secure_url) {
        setUrl(data.secure_url)
        onSubida(data.secure_url)
      } else {
        setError('No se pudo subir la imagen. Intenta de nuevo.')
        setPreview(null)
      }
    } catch {
      setError('Error de conexión al subir la imagen.')
      setPreview(null)
    } finally { setSubiendo(false) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e) => { handleFile(e.target.files[0]) }

  const quitar = () => { setPreview(null); setUrl(''); onSubida(''); if (inputRef.current) inputRef.current.value = '' }

  return (
    <div className="sf-wrap">
      <label className="sf-label">
        {label}
        {obligatorio && <span className="sf-req">Requerido</span>}
      </label>

      {!preview ? (
        <div
          className="sf-dropzone"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div className="sf-dropzone-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          <p className="sf-dropzone-txt">Arrastra la foto aquí o <span className="sf-link">selecciona</span></p>
          <p className="sf-dropzone-hint">JPG, PNG o HEIC · Máx 10 MB</p>
          <input ref={inputRef} type="file" accept="image/*" className="sf-input-hidden" onChange={handleChange} />
        </div>
      ) : (
        <div className="sf-preview-wrap">
          {subiendo && (
            <div className="sf-overlay">
              <div className="sf-spinner" />
              <p>Subiendo...</p>
            </div>
          )}
          <img src={preview} alt="Comprobante" className="sf-preview-img" />
          {!subiendo && (
            <div className="sf-preview-actions">
              {url && <span className="sf-ok">Foto subida correctamente</span>}
              <button type="button" className="sf-btn-quitar" onClick={quitar}>Quitar foto</button>
            </div>
          )}
        </div>
      )}

      {error && <p className="sf-error">{error}</p>}
    </div>
  )
}
