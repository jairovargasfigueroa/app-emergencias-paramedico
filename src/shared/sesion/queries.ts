import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { borrarClaveDispositivo, borrarSesion, leerDispositivo, leerSesion, type Dispositivo } from './almacen'

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
