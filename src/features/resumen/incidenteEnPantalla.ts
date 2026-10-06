import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

let incidenteVisible: number | null = null
let atencionVisible: number | null = null

/**
 * El incidente cuyo detalle está a la vista, o `null`. Lo usa el push de un resumen nuevo: si es el de este incidente,
 * alcanza con volver a pedirlo, sin abrir la pantalla otra vez ni interrumpir con el aviso.
 */
export function incidenteEnPantalla(): number | null {
  return incidenteVisible
}

/**
 * El incidente de la atención en curso, si su pantalla tiene el foco, o `null`. Ahí el resumen ya se ve sin abrir los
 * detalles, así que un resumen nuevo no suena ni salta: se vuelve a pedir y, en camino, se lee en voz.
 */
export function incidenteDeLaAtencionEnPantalla(): number | null {
  return atencionVisible
}

/** Marca el incidente como visible mientras su pantalla tiene el foco. */
export function useMarcarIncidenteEnPantalla(incidenteId: number) {
  useFocusEffect(
    useCallback(() => {
      incidenteVisible = incidenteId
      return () => {
        if (incidenteVisible === incidenteId) {
          incidenteVisible = null
        }
      }
    }, [incidenteId]),
  )
}

/**
 * Marca la atención en curso como visible mientras su pantalla tiene el foco. No depende de que los detalles estén
 * abiertos, que arrancan cerrados. `null` en un traslado, que no tiene incidente ni resumen.
 */
export function useMarcarAtencionEnPantalla(incidenteId: number | null) {
  useFocusEffect(
    useCallback(() => {
      if (incidenteId === null) {
        return
      }
      atencionVisible = incidenteId
      return () => {
        if (atencionVisible === incidenteId) {
          atencionVisible = null
        }
      }
    }, [incidenteId]),
  )
}
