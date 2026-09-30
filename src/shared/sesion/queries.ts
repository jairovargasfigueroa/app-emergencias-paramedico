import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  borrarClaveDispositivo,
  borrarSesion,
  guardarSesion,
  leerDispositivo,
  leerSesion,
  type Dispositivo,
  type Sesion,
} from './almacen'
import { sesionApi } from './api'

export const sesionKeys = {
  actual: ['sesion'] as const,
  dispositivo: ['dispositivo'] as const,
}

/** Sesión abierta en este teléfono, o `null`. Se lee del almacén local: no depende de la conexión. */
export const sesionQuery = <T>() =>
  queryOptions({
    queryKey: sesionKeys.actual,
    queryFn: () => leerSesion<T>(),
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** La clave y el último número de este teléfono. También se leen del almacén local. */
export const dispositivoQuery = () =>
  queryOptions({
    queryKey: sesionKeys.dispositivo,
    queryFn: () => leerDispositivo(),
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/**
 * Cambia el token por uno nuevo con la clave del teléfono vinculado. Si ya no se puede renovar —la cuenta se activó en
 * otro teléfono o se desactivó—, el servidor responde 401 y el manejador global cierra la sesión. Sin conexión falla
 * y no pasa nada: se vuelve a intentar la próxima vez que se abra la app.
 */
export const renovarSesionMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (claveDispositivo: string) => {
      const tokenAnterior = queryClient.getQueryData<Sesion<unknown> | null>(sesionKeys.actual)?.token
      const renovada = await sesionApi.renovar(claveDispositivo)
      return { tokenAnterior, ...renovada }
    },
    // Sin esperar a que vuelva la conexión: una renovación en pausa podría salir cuando ya entró otro paramédico.
    networkMode: 'always',
    onSuccess: async ({ tokenAnterior, token, venceEn }) => {
      const actual = queryClient.getQueryData<Sesion<unknown> | null>(sesionKeys.actual)
      // Si mientras tanto se cerró la sesión o entró otro, el token nuevo ya no es de nadie.
      if (!actual || actual.token !== tokenAnterior) {
        return
      }
      const renovada = { ...actual, token, venceEn }
      // Primero la caché, igual que al cerrar la sesión: si justo se cierra, el cierre llega después y gana.
      queryClient.setQueryData(sesionKeys.actual, renovada)
      await guardarSesion(renovada)
    },
  })

/** Cierra la sesión. El guard del router deja a la vista solo la pantalla de entrada. */
export async function cerrarSesion(queryClient: QueryClient) {
  // Primero la pantalla, después el almacén: nada espera al teléfono para reaccionar.
  queryClient.setQueryData(sesionKeys.actual, null)
  await borrarSesion()
}

/**
 * Este teléfono ya no está vinculado a la cuenta: la clave guardada no sirve y la próxima entrada es con un código
 * nuevo de la central. El último número se conserva, para no tener que escribirlo otra vez.
 */
export async function olvidarClaveDispositivo(queryClient: QueryClient) {
  queryClient.setQueryData<Dispositivo>(sesionKeys.dispositivo, (antes) => ({
    claveDispositivo: null,
    ultimoTelefono: antes?.ultimoTelefono ?? null,
  }))
  await borrarClaveDispositivo()
}
