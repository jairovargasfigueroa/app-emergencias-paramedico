import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

let incidenteVisible: number | null = null

/**
 * El incidente cuyo detalle está a la vista, o `null`. Lo usa el push de un resumen nuevo: si es el de este incidente,
 * alcanza con volver a pedirlo, sin abrir la pantalla otra vez ni interrumpir con el aviso.
 */
export function incidenteEnPantalla(): number | null {
  return incidenteVisible
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
