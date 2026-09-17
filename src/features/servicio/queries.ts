import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  borrarParamedicoGuardado,
  guardarAvisoDeServicioVisto,
  guardarParamedico,
  leerAvisoDeServicioVisto,
  leerParamedicoGuardado,
} from './almacen'
import { servicioApi } from './api'

export const servicioKeys = {
  paramedico: ['paramedico'] as const,
  actual: (paramedicoId: number) => ['servicio', paramedicoId] as const,
  avisoVisto: (paramedicoId: number) => ['aviso-servicio', paramedicoId] as const,
}

/** Paramédico identificado en este teléfono, o `null`. Se lee del almacén local: no depende de la conexión. */
export const paramedicoGuardadoQuery = () =>
  queryOptions({
    queryKey: servicioKeys.paramedico,
    queryFn: leerParamedicoGuardado,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** Ambulancia asignada y si el paramédico está en servicio (PB-03 R4). */
export const servicioActualQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: servicioKeys.actual(paramedicoId),
    queryFn: ({ signal }) => servicioApi.actual(paramedicoId, signal),
  })

/** Aviso de una sola vez sobre compartir la ubicación durante el turno. Se lee del almacén local. */
export const avisoDeServicioVistoQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: servicioKeys.avisoVisto(paramedicoId),
    queryFn: () => leerAvisoDeServicioVisto(paramedicoId),
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

export const marcarAvisoDeServicioVistoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => guardarAvisoDeServicioVisto(paramedicoId),
    onSuccess: (_resultado, paramedicoId) => {
      queryClient.setQueryData(servicioKeys.avisoVisto(paramedicoId), true)
    },
  })

export const identificarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (telefono: string) => {
      const paramedico = await servicioApi.identificar(telefono)
      const guardado = { id: paramedico.id, nombreCompleto: paramedico.nombreCompleto }
      await guardarParamedico(guardado)
      return guardado
    },
    onSuccess: (guardado) => {
      queryClient.setQueryData(servicioKeys.paramedico, guardado)
    },
  })

/** PB-05 CA-19: la ambulancia fuera de servicio por avería vuelve a DISPONIBLE. */
export const reactivarAmbulanciaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (ambulanciaId: number) => servicioApi.reactivarAmbulancia(ambulanciaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicio'] }),
  })

/** Salir, o el backend ya no reconoce al paramédico guardado: la app vuelve a pedir la identificación. */
export async function olvidarParamedico(queryClient: QueryClient) {
  await borrarParamedicoGuardado()
  queryClient.removeQueries({ queryKey: ['servicio'] })
  queryClient.setQueryData(servicioKeys.paramedico, null)
}
