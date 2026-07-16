// Formatea un contador para mostrarlo en una burbuja de notificación,
// estilo Facebook/apps móviles: 1-9 tal cual, 10+ se muestra como "9+"
export const formatearBadge = (n) => {
  if (!n || n <= 0) return null
  return n > 9 ? '9+' : String(n)
}
