import { useSyncExternalStore } from 'react'

import type { Coordenadas } from '@/shared/formato/distancia'

let actual: Coordenadas | null = null
const oyentes = new Set<() => void>()

/** Última posición conocida del teléfono. La usan el mapa, el orden por cercanía y los hitos de la atención. */
export function usePosicionActual() {
  return useSyncExternalStore(suscribir, leerPosicionActual)
}

export function leerPosicionActual() {
  return actual
}

export function actualizarPosicionActual(posicion: Coordenadas) {
  actual = posicion
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
