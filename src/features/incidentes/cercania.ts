import { distanciaEnMetros, type Coordenadas } from '@/shared/formato/distancia'

import type { IncidenteAbierto } from './api'

export type IncidenteCercano = {
  incidente: IncidenteAbierto
  /** `null` mientras no se conoce la posición del paramédico. */
  distanciaM: number | null
}

/**
 * PB-03 R1: la cercanía ordena, no filtra. Todos los incidentes quedan en la lista, del más cercano al más lejano.
 * Sin posición conocida, se ordenan del más antiguo al más reciente.
 */
export function ordenarPorCercania(incidentes: IncidenteAbierto[], posicion: Coordenadas | null): IncidenteCercano[] {
  const cercanos = incidentes.map((incidente) => ({
    incidente,
    distanciaM: posicion ? distanciaEnMetros(posicion, incidente) : null,
  }))
  return cercanos.sort((a, b) => {
    if (a.distanciaM !== null && b.distanciaM !== null) {
      return a.distanciaM - b.distanciaM
    }
    return a.incidente.fechaHoraCreacion.localeCompare(b.incidente.fechaHoraCreacion)
  })
}

/** "5 afectados", "1 afectado" o "Afectados sin reportar". */
export function textoAfectados(cantidad: number | undefined): string {
  if (cantidad === undefined || cantidad === null) {
    return 'Afectados sin reportar'
  }
  return cantidad === 1 ? '1 afectado' : `${cantidad} afectados`
}

/** "1 unidad acudiendo", "2 unidades acudiendo". */
export function textoUnidadesAcudiendo(cantidad: number): string {
  return cantidad === 1 ? '1 unidad acudiendo' : `${cantidad} unidades acudiendo`
}
