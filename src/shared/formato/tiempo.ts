/** "hace 40 s", "hace 4 min", "hace 2 h" desde una fecha ISO hasta `ahora`. */
export function tiempoTranscurrido(iso: string, ahora: number = Date.now()): string {
  const segundos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000))
  if (segundos < 60) {
    return `hace ${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `hace ${minutos} min`
  }
  return `hace ${Math.floor(minutos / 60)} h`
}

/** "14:36" en la hora local del teléfono. */
export function horaCorta(iso: string): string {
  const fecha = new Date(iso)
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}
