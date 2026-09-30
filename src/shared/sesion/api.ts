import { api } from '@/shared/api/cliente'

/** `SesionResponse.Renovada` del backend: el token nuevo y cuándo vence, en ISO-8601 UTC. */
export type SesionRenovada = {
  token: string
  venceEn: string
}

export const sesionApi = {
  /** Cambia el token por uno nuevo antes de que venza. El paramédico prueba con la clave de su teléfono vinculado. */
  renovar: (claveDispositivo: string) => api.post<SesionRenovada>('/sesion/renovacion', { claveDispositivo }),
}
