import { queryOptions } from '@tanstack/react-query'

import { evidenciasApi } from './api'

export const evidenciasKeys = {
  url: (evidenciaId: number) => ['url-evidencia', evidenciaId] as const,
}

/** Margen para no entregar una URL que vence mientras el reproductor todavía la está abriendo. */
const MARGEN_MS = 30_000

/**
 * URL temporal de una evidencia. Se pide recién cuando hace falta y sirve hasta poco antes de vencer; al dejar de
 * usarse se descarta, porque es un secreto de corta vida. Si el archivo no carga, la pantalla la invalida y se firma
 * otra.
 */
export const urlEvidenciaQuery = (evidenciaId: number) =>
  queryOptions({
    queryKey: evidenciasKeys.url(evidenciaId),
    queryFn: () => evidenciasApi.url(evidenciaId),
    staleTime: (query) => {
      const venceEn = query.state.data?.venceEn
      return venceEn ? Math.max(0, new Date(venceEn).getTime() - Date.now() - MARGEN_MS) : 0
    },
    gcTime: 0,
    // Una URL nueva rearma el reproductor y lo haría sonar solo al volver a la app: se renueva únicamente cuando el
    // archivo no carga o cuando se vuelve a abrir.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
