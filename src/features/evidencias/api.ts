import { api } from '@/shared/api/cliente'

/** `LecturaEvidenciaResponse` del backend: URL firmada para leer el archivo directo del almacén. */
export type LecturaEvidencia = {
  url: string
  /** Pasada esta fecha la URL deja de servir y hay que pedir otra. */
  venceEn: string
}

export const evidenciasApi = {
  url: (evidenciaId: number) => api.get<LecturaEvidencia>(`/evidencias/${evidenciaId}/url`),
}
