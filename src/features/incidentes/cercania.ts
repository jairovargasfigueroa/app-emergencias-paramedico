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

/** "3 personas afectadas", "1 persona afectada" o "Afectados sin reportar". */
export function textoPersonasAfectadas(cantidad: number | undefined): string {
  if (cantidad === undefined || cantidad === null) {
    return 'Afectados sin reportar'
  }
  return cantidad === 1 ? '1 persona afectada' : `${cantidad} personas afectadas`
}

/** Lo decisivo antes de acudir: "nadie va todavía", "1 unidad en camino", "2 unidades en camino" (PB-03 R2). */
export function textoUnidadesEnCamino(cantidad: number): string {
  if (cantidad === 0) {
    return 'nadie va todavía'
  }
  return cantidad === 1 ? '1 unidad en camino' : `${cantidad} unidades en camino`
}

/** Cuántas unidades acuden además de la mía: "nadie más va", "1 unidad más va", "2 unidades más van". */
export function textoOtrasUnidades(unidadesAcudiendo: number): string {
  const otras = Math.max(0, unidadesAcudiendo - 1)
  if (otras === 0) {
    return 'nadie más va'
  }
  return otras === 1 ? '1 unidad más va' : `${otras} unidades más van`
}
