import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { aplicarAtencion } from '@/features/atencion/queries'
import { servicioKeys } from '@/features/servicio/queries'

import type { IncidenteAbierto } from './api'
import { incidentesApi } from './api'
import { direccionAproximada } from './direcciones'

export const incidentesKeys = {
  direccion: (incidenteId: number) => ['direccion-incidente', incidenteId] as const,
}

/**
 * Dirección aproximada del incidente, resuelta en el teléfono. Se cachea para siempre por incidente: sus coordenadas
 * no cambian y la consulta no tiene por qué repetirse.
 */
export const direccionIncidenteQuery = (incidente: Pick<IncidenteAbierto, 'id' | 'latitud' | 'longitud'>) =>
  queryOptions({
    queryKey: incidentesKeys.direccion(incidente.id),
    queryFn: () => direccionAproximada(incidente.latitud, incidente.longitud),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })

export type AcudirAIncidente = {
  paramedicoId: number
  incidenteId: number
}

/**
 * PB-04 R1: la primera unidad toma. Si otra ya acude, falla con 409 `INCIDENTE_YA_TOMADO` y su contexto, y la
 * pantalla ofrece sumarse o desistir.
 */
export const tomarIncidenteMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, incidenteId }: AcudirAIncidente) => incidentesApi.tomar(incidenteId),
    onSuccess: (atencion, { paramedicoId }) => {
      aplicarAtencion(queryClient, paramedicoId, atencion)
      return queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
    },
  })

/** PB-04 R4: sumarse crea una atención propia e independiente para la ambulancia del paramédico. */
export const sumarseAIncidenteMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, incidenteId }: AcudirAIncidente) => incidentesApi.sumarse(incidenteId),
    onSuccess: (atencion, { paramedicoId }) => {
      aplicarAtencion(queryClient, paramedicoId, atencion)
      return queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
    },
  })
