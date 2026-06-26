import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './PagoTarjeta.css'

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY

const cargarSDK = () => new Promise((resolve) => {
  if (window.MercadoPago) { resolve(); return }
  const script = document.createElement('script')
  script.src = 'https://sdk.mercadopago.com/js/v2'
  script.onload = resolve
  document.body.appendChild(script)
})

export default function PagoTarjeta({ cuota, residentesDepto, esDirectivo, onExito, onCancelar }) {
  const { user } = useAuth()

  const [mp,       setMp]       = useState(null)
  const [form,     setForm]     = useState({ numero: '', nombre: '', vencimiento: '', cvv: '', tipoDoc: 'DNI', numeroDoc: '', email: user?.email || '' })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [sdkListo, setSdkListo] = useState(false)

  useEffect(() => {
    cargarSDK().then(() => {
      const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' })
      setMp(mpInstance)
      setSdkListo(true)
    })
  }, [])

  const formatearNumero = (v) => v.replace(/\D/g, '').slice(0,16).replace(/(.{4})/g, '$1 ').trim()
  const formatearVenc   = (v) => { const d = v.replace(/\D/g, '').slice(0,4); return d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d }

  const procesarPago = async () => {
    if (!sdkListo || !mp) { setError('SDK de pago no cargado. Recarga la página.'); return }
    if (esDirectivo && !form.pagadorId) { setError('Selecciona quién está pagando'); return }
    if (!form.email) { setError('Ingresa el correo del titular de la tarjeta'); return }
    setLoading(true); setError('')
    try {
      const [mes, anio] = form.vencimiento.split('/')
      const tokenData = await mp.createCardToken({
        cardNumber:          form.numero.replace(/\s/g, ''),
        cardholderName:      form.nombre,
        cardExpirationMonth: mes,
        cardExpirationYear:  '20' + anio,
        securityCode:        form.cvv,
        identificationType:  form.tipoDoc,
        identificationNumber: form.numeroDoc,
      })
      if (tokenData.error) { setError('Datos de tarjeta inválidos. Verifica e intenta de nuevo.'); setLoading(false); return }
      await api.post('/api/mercadopago/pagar', {
        cuotaId:    cuota.cuotaId,
        token:      tokenData.id,
        email:      form.email,
        metodoPago: tokenData.payment_method_id || 'visa',
        cuotas:     1,
        pagadorId:  esDirectivo ? Number(form.pagadorId) : null,
      })
      onExito()
    } catch (e) {
      setError(e.response?.data || 'No se pudo procesar el pago. Intenta nuevamente.')
    } finally { setLoading(false) }
  }

  return (
    <div className="pt-wrap">
      {esDirectivo && (
        <div className="pt-field pt-full">
          <label className="pt-label">¿Quién está pagando?</label>
          <select className="pt-input" value={form.pagadorId} onChange={e => setForm({...form, pagadorId: e.target.value})}>
            <option value="">-- Selecciona el residente --</option>
            {residentesDepto.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} ({r.tipo === 'PROPIETARIO' ? 'Propietario' : 'Inquilino'})</option>
            ))}
          </select>
        </div>
      )}

      <div className="pt-grid">
        <div className="pt-field pt-full">
          <label className="pt-label">Número de tarjeta</label>
          <input className="pt-input pt-numero" value={form.numero}
            onChange={e => setForm({...form, numero: formatearNumero(e.target.value)})}
            placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" />
        </div>
        <div className="pt-field pt-full">
          <label className="pt-label">Nombre del titular</label>
          <input className="pt-input" value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})}
            placeholder="" />
        </div>
        <div className="pt-field">
          <label className="pt-label">Tipo de documento</label>
          <select className="pt-input" value={form.tipoDoc} onChange={e => setForm({...form, tipoDoc: e.target.value})}>
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
            <option value="RUC">RUC</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="pt-field">
          <label className="pt-label">Número de documento</label>
          <input className="pt-input" value={form.numeroDoc}
            onChange={e => setForm({...form, numeroDoc: e.target.value.replace(/\D/g,'').slice(0,12)})}
            placeholder={form.tipoDoc === 'DNI' ? '12345678' : form.tipoDoc === 'RUC' ? '20123456789' : ''}
            inputMode="numeric" />
        </div>
        <div className="pt-field">
          <label className="pt-label">Vencimiento</label>
          <input className="pt-input" value={form.vencimiento}
            onChange={e => setForm({...form, vencimiento: formatearVenc(e.target.value)})}
            placeholder="MM/AA" maxLength={5} inputMode="numeric" />
        </div>
        <div className="pt-field">
          <label className="pt-label">CVV</label>
          <input className="pt-input" value={form.cvv}
            onChange={e => setForm({...form, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})}
            placeholder="" maxLength={4} inputMode="numeric" type="password" />
        </div>
        <div className="pt-field pt-full">
          <label className="pt-label">Correo del titular</label>
          <input className="pt-input" type="email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="correo@ejemplo.com" />
        </div>
      </div>

      {error && <div className="pt-error">{error}</div>}

      <div className="pt-acciones">
        <button className="pt-btn-cancelar" onClick={onCancelar} disabled={loading}>
          Cancelar
        </button>
        <button className="pt-btn-pagar" onClick={procesarPago} disabled={loading || !sdkListo}>
          {loading ? 'Procesando...' : `Pagar S/ ${Number(cuota.montoCalculado)?.toFixed(2)}`}
        </button>
      </div>

      <div className="pt-seguro">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Pago seguro procesado por Mercado Pago
      </div>
    </div>
  )
}
