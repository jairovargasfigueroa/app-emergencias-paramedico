import { queryOptions } from '@tanstack/react-query'

import type { ResumenIa, ResumenIncidente } from './api'
import { resumenApi } from './api'

export const resumenKeys = {
  incidente: (incidenteId: number) => ['resumen-incidente', incidenteId] as const,
}

/**
 * Red de seguridad por si el aviso de Firebase no llega: mientras la pantalla está abierta se vuelve a preguntar cada
 * tanto. TanStack Query lo pausa con la app en segundo plano.
 */
const RESPALDO_MS = 60_000

/**
 * El resumen preliminar vigente y las evidencias del incidente. Lo normal es que se vuelva a pedir cuando Firebase
 * avisa una versión nueva (`useResumenEnVivo`).
 */
export const resumenIncidenteQuery = (incidenteId: number) =>
  queryOptions({
    queryKey: resumenKeys.incidente(incidenteId),
    queryFn: async () => normalizar(await resumenApi.consultar(incidenteId)),
    refetchInterval: RESPALDO_MS,
  })

/** El objeto de la IA se guarda tal como vino: si falta una lista, se deja vacía para no romper la pantalla. */
function normalizar(respuesta: ResumenIncidente): ResumenIncidente {
  const resumen = respuesta.resumen
  return {
    ...respuesta,
    evidencias: respuesta.evidencias ?? [],
    resumen: resumen
      ? {
          ...resumen,
          people: resumen.people ?? null,
          hazards: resumen.hazards ?? [],
          findings: resumen.findings ?? [],
          risks: resumen.risks ?? [],
          severity: {
            level: resumen.severity?.level ?? 'undetermined',
            basis: resumen.severity?.basis ?? [],
          },
          conflicts: resumen.conflicts ?? [],
          limitations: resumen.limitations ?? [],
        } satisfies ResumenIa
      : null,
  }
}
