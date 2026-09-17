import { mutationOptions, type QueryClient } from '@tanstack/react-query'

import { aplicarAtencion } from '@/features/atencion/queries'
import { servicioKeys } from '@/features/servicio/queries'

import { incidentesApi } from './api'

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
    mutationFn: ({ paramedicoId, incidenteId }: AcudirAIncidente) => incidentesApi.tomar(paramedicoId, incidenteId),
    onSuccess: (atencion, { paramedicoId }) => {
      aplicarAtencion(queryClient, paramedicoId, atencion)
      return queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
    },
  })

/** PB-04 R4: sumarse crea una atención propia e independiente para la ambulancia del paramédico. */
export const sumarseAIncidenteMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, incidenteId }: AcudirAIncidente) => incidentesApi.sumarse(paramedicoId, incidenteId),
    onSuccess: (atencion, { paramedicoId }) => {
      aplicarAtencion(queryClient, paramedicoId, atencion)
      return queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
    },
  })
