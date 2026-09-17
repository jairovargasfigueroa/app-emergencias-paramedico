import { api } from '@/shared/api/cliente'

export const posicionApi = {
  /** El servidor la publica en tiempo real y guarda la última posición de la ambulancia cada cierto tiempo. */
  enviar: (paramedicoId: number, latitud: number, longitud: number) =>
    api.post<void>('/posiciones', { latitud, longitud }, { usuarioId: paramedicoId }),
}
