import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { ErrorApi } from '@/shared/api/cliente'
import { guardarSesion } from '@/shared/sesion/almacen'
import { cerrarSesion, sesionKeys, sesionQuery } from '@/shared/sesion/queries'

import { guardarAvisoDeServicioVisto, leerAvisoDeServicioVisto, type ParamedicoGuardado } from './almacen'
import { servicioApi, type ServicioActual } from './api'

export const servicioKeys = {
  actual: (paramedicoId: number) => ['servicio', paramedicoId] as const,
  avisoVisto: (paramedicoId: number) => ['aviso-servicio', paramedicoId] as const,
}

/** Paramédico identificado en este teléfono, o `null`: es la sesión guardada, vista desde el servicio. */
export const paramedicoGuardadoQuery = () =>
  queryOptions({
    ...sesionQuery<ParamedicoGuardado>(),
    select: (sesion) => sesion?.usuario ?? null,
  })

/** Ambulancia asignada y si el paramédico está en servicio (PB-03 R4). */
export const servicioActualQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: servicioKeys.actual(paramedicoId),
    queryFn: ({ signal }) => servicioApi.actual(signal),
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

/**
 * Un 409 puede ser que lo mismo ya lo hizo otro: la central, o el compañero desde su teléfono. Se vuelve a pedir el
 * servicio para ver cómo quedó de verdad. `null` si el error era otro.
 */
async function servicioTrasConflicto(queryClient: QueryClient, error: unknown): Promise<ServicioActual | null> {
  if (!(error instanceof ErrorApi && error.status === 409)) {
    return null
  }
  await queryClient.refetchQueries({ queryKey: ['servicio'] })
  return queryClient.getQueriesData<ServicioActual>({ queryKey: ['servicio'] })[0]?.[1] ?? null
}

/** El turno se refleja en el servicio, así que al abrirlo o cerrarlo se vuelve a consultar todo de una vez. */
export const iniciarTurnoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: () => servicioApi.iniciarTurno(),
    onSuccess: (_turno, _variables, _contexto) => queryClient.invalidateQueries({ queryKey: ['servicio'] }),
  })

/**
 * Si la central ya le cerró el turno, el servidor rechaza cerrarlo de nuevo: no es un error, ya está hecho. En ese caso
 * devuelve `null`.
 */
export const terminarTurnoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async () => {
      try {
        return await servicioApi.terminarTurno()
      } catch (error) {
        const servicio = await servicioTrasConflicto(queryClient, error)
        if (servicio && !servicio.turno) {
          return null
        }
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicio'] }),
  })

export const identificarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (telefono: string) => {
      const { token, venceEn, paramedico } = await servicioApi.identificar(telefono)
      const sesion = { token, venceEn, usuario: { id: paramedico.id, nombreCompleto: paramedico.nombreCompleto } }
      await guardarSesion(sesion)
      return sesion
    },
    onSuccess: (sesion) => {
      queryClient.setQueryData(sesionKeys.actual, sesion)
    },
  })

/**
 * PB-05 CA-19: la ambulancia fuera de servicio por avería vuelve a DISPONIBLE. Si ya la reactivó otro —la central, o el
 * compañero desde su teléfono—, el servidor lo rechaza: no es un error, ya está hecho. En ese caso devuelve `null`.
 */
export const reactivarAmbulanciaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (ambulanciaId: number) => {
      try {
        return await servicioApi.reactivarAmbulancia(ambulanciaId)
      } catch (error) {
        const servicio = await servicioTrasConflicto(queryClient, error)
        if (servicio?.ambulancia && servicio.ambulancia.estado !== 'FUERA_DE_SERVICIO') {
          return null
        }
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicio'] }),
  })

/** Salir, o el backend ya no reconoce al paramédico guardado: la app vuelve a pedir la identificación. */
export async function olvidarParamedico(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: ['servicio'] })
  await cerrarSesion(queryClient)
}
