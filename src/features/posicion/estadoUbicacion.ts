import * as Linking from 'expo-linking'
import { useSyncExternalStore } from 'react'

/**
 * En qué está la ubicación del teléfono. Sin ella los incidentes no se ordenan por cercanía y los hitos no se pueden
 * marcar, así que tiene que verse y poder arreglarse, no fallar en silencio.
 */
export type EstadoUbicacion =
  /** Pidiendo el permiso. */
  | 'pidiendo'
  /** El paramédico lo negó, pero se le puede volver a preguntar. */
  | 'sin-permiso'
  /** Lo negó para siempre: solo se arregla en los ajustes del sistema. */
  | 'permiso-bloqueado'
  /** Con permiso, esperando la primera posición. */
  | 'esperando'
  /** Llegando posiciones. */
  | 'activa'

let actual: EstadoUbicacion = 'pidiendo'
let intentos = 0
const oyentes = new Set<() => void>()

export function useEstadoUbicacion() {
  return useSyncExternalStore(suscribir, leerEstadoUbicacion)
}

/** Cambia cada vez que el paramédico pide reactivar la ubicación: reinicia el seguimiento. */
export function useIntentosDeUbicacion() {
  return useSyncExternalStore(suscribir, () => intentos)
}

export function leerEstadoUbicacion() {
  return actual
}

export function cambiarEstadoUbicacion(siguiente: EstadoUbicacion) {
  if (actual !== siguiente) {
    actual = siguiente
    avisar()
  }
}

/** Acción de la tarjeta de aviso: volver a pedir el permiso o, si está bloqueado, abrir los ajustes del sistema. */
export function activarUbicacion() {
  if (actual === 'permiso-bloqueado') {
    void Linking.openSettings()
    return
  }
  intentos += 1
  avisar()
}

function avisar() {
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
