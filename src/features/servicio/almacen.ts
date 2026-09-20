import * as SecureStore from 'expo-secure-store'

/** Quién es el paramédico de la sesión abierta. El resto de sus datos se consulta al backend. */
export type ParamedicoGuardado = {
  id: number
  nombreCompleto: string
}

const CLAVE_AVISO_SERVICIO = 'sga.aviso-servicio'

/**
 * Si este paramédico ya vio el aviso de que se comparte la ubicación de su unidad durante el turno. Se guarda su id:
 * otro paramédico en el mismo teléfono también tiene que verlo, es su ubicación.
 */
export async function leerAvisoDeServicioVisto(paramedicoId: number): Promise<boolean> {
  return (await SecureStore.getItemAsync(CLAVE_AVISO_SERVICIO)) === String(paramedicoId)
}

export function guardarAvisoDeServicioVisto(paramedicoId: number) {
  return SecureStore.setItemAsync(CLAVE_AVISO_SERVICIO, String(paramedicoId))
}
