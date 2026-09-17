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

export type AvisoDeUbicacion = {
  texto: string
  /** Si hay algo que el paramédico pueda hacer ahora mismo para arreglarlo. */
  conAccion: boolean
}

/** Qué decirle cuando la ubicación no está llegando. Con `null` todo está bien y no hay nada que avisar. */
export function avisoDeUbicacion(estado: EstadoUbicacion): AvisoDeUbicacion | null {
  switch (estado) {
    case 'activa':
      return null
    case 'pidiendo':
      return { texto: 'Pidiendo permiso para usar tu ubicación.', conAccion: false }
    case 'esperando':
      return { texto: 'Esperando la señal del GPS. Hasta que llegue, las emergencias no se ordenan por cercanía.', conAccion: false }
    default:
      return { texto: 'Sin tu ubicación las emergencias no se ordenan por cercanía.', conAccion: true }
  }
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
