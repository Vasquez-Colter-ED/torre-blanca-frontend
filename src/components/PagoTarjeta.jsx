import { useState, useEffect } from 'react'
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
  const [mp,       setMp]       = useState(null)
  const [form,     setForm]     = useState({ numero: '', nombre: '', vencimiento: '', cvv: '', pagadorId: '', email: '' })
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
    <div className="pago-tarjeta">
      <div className="pago-tarjeta-header">
        <h3 className="pago-tarjeta-titulo">Pagar con tarjeta</h3>
        <p className="pago-tarjeta-monto">
          Depto <strong>{cuota.numeroDepartamento}</strong> · Monto a pagar: <strong className="monto-fijo">S/ {cuota.montoCalculado?.toFixed(2)}</strong>
        </p>
        <p className="pago-tarjeta-hint">🔒 El monto es fijo y no puede modificarse</p>
      </div>

      <div className="pago-tarjeta-form">
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
        <div className="pt-field pt-full">
          <label className="pt-label">Número de tarjeta</label>
          <input className="pt-input pt-numero" value={form.numero}
            onChange={e => setForm({...form, numero: formatearNumero(e.target.value)})}
            placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" />
        </div>
        <div className="pt-field pt-full">
          <label className="pt-label">Nombre en la tarjeta</label>
          <input className="pt-input" value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})}
            placeholder="COMO APARECE EN LA TARJETA" />
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
            placeholder="•••" maxLength={4} inputMode="numeric" type="password" />
        </div>
        <div className="pt-field pt-full">
          <label className="pt-label">Correo del titular</label>
          <input className="pt-input" type="email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="correo@ejemplo.com" />
        </div>
      </div>

      {error && <div className="pago-tarjeta-error">{error}</div>}

      <div className="pago-tarjeta-acciones">
        <button className="btn-pt-cancelar" onClick={onCancelar} disabled={loading}>Cancelar</button>
        <button className="btn-pt-pagar" onClick={procesarPago} disabled={loading || !sdkListo}>
          {loading ? 'Procesando...' : `Pagar S/ ${cuota.montoCalculado?.toFixed(2)}`}
        </button>
      </div>
      <p className="pago-seguro-hint">🔐 Pago seguro procesado por Mercado Pago</p>
    </div>
  )
}
