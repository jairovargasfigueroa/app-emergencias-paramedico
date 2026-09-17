import type { IncidenteAbierto } from './api'

/** Minutos sin ninguna unidad tras los que una emergencia se marca como abandonada. */
export const MINUTOS_ABANDONO = minutosDeEntorno(process.env.EXPO_PUBLIC_MINUTOS_ABANDONO)

/**
 * Si el incidente lleva demasiado tiempo sin que nadie acuda. Solo cambia cómo se ve: el orden de la lista sigue
 * siendo por cercanía, que ordena y no filtra (PB-03 R1).
 */
export function estaAbandonado(incidente: IncidenteAbierto, ahora: number): boolean {
  if (incidente.unidadesAcudiendo > 0) {
    return false
  }
  const minutos = (ahora - new Date(incidente.fechaHoraCreacion).getTime()) / 60_000
  return minutos >= MINUTOS_ABANDONO
}

function minutosDeEntorno(valor: string | undefined) {
  const minutos = Number(valor)
  return valor && Number.isFinite(minutos) && minutos > 0 ? minutos : 5
}
