import { useQuery } from '@tanstack/react-query'
import * as Speech from 'expo-speech'
import { useCallback, useEffect, useState } from 'react'

import { resumenIncidenteQuery } from '@/features/resumen/queries'

import { guionDeLectura } from './guion'

/** Un poco más lento que lo normal: se escucha con la sirena y el motor, y no se puede volver a leer con la vista. */
const OPCIONES = { language: 'es', rate: 0.95 }

/**
 * La última versión leída de cada incidente. Vive fuera del componente para que un nuevo render, o volver a la
 * pantalla, no repita la lectura.
 */
let ultimaLectura: { incidenteId: number; version: number } | null = null

/** Incidentes con un cambio importante avisado por push que todavía no se leyó. */
const actualizacionesPendientes = new Set<number>()
const oyentes = new Set<() => void>()

/**
 * La llama el push de un resumen nuevo con la atención a la vista. El backend solo lo manda si cambió algo importante
 * y solo a las unidades en camino: es lo que separa una actualización que se lee de un cambio de redacción, que se ve
 * pero no se lee. La versión nueva puede llegar antes o después del push; se lee cuando están las dos cosas.
 */
export function avisarActualizacionImportante(incidenteId: number) {
  actualizacionesPendientes.add(incidenteId)
  oyentes.forEach((oyente) => oyente())
}

/** Corta lo que estuviera leyendo: una versión nueva reemplaza a la anterior, no se encola detrás. */
function leer(texto: string) {
  void Speech.stop()
  Speech.speak(texto, OPCIONES)
}

type Opciones = {
  /** `null` en un traslado, que no tiene resumen. */
  incidenteId: number | null
  placa: string
  /** Solo se lee en camino: al llegar, la tripulación ya ve la escena. */
  enCamino: boolean
}

/**
 * Lee el resumen en voz alta, como una operadora por radio: la primera vez que se ve una versión de la atención y
 * cada vez que llega un cambio importante, empezando con "Actualización". Devuelve cómo repetirlo, o `null` cuando no
 * hay nada que leer.
 */
export function useLectura({ incidenteId, placa, enCamino }: Opciones) {
  const datos = useQuery({ ...resumenIncidenteQuery(incidenteId ?? 0), enabled: incidenteId !== null }).data
  const version = datos?.version ?? null
  const resumen = datos?.resumen ?? null
  const [avisos, setAvisos] = useState(0)

  useEffect(() => {
    const oyente = () => setAvisos((cantidad) => cantidad + 1)
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  }, [])

  useEffect(() => {
    if (!enCamino || incidenteId === null || version === null || !resumen) {
      return
    }
    const leida = ultimaLectura?.incidenteId === incidenteId ? ultimaLectura.version : null
    const actualizacion = leida !== null && version > leida && actualizacionesPendientes.has(incidenteId)
    // Ya leída, o una versión nueva sin cambio importante: no se vuelve a leer.
    if (leida !== null && !actualizacion) {
      return
    }
    actualizacionesPendientes.delete(incidenteId)
    ultimaLectura = { incidenteId, version }
    leer(guionDeLectura(resumen, { placa, actualizacion }))
  }, [enCamino, incidenteId, version, resumen, placa, avisos])

  // Al llegar, o si la atención se termina, se deja de leer.
  useEffect(() => {
    if (!enCamino) {
      return
    }
    return () => {
      void Speech.stop()
    }
  }, [enCamino])

  const repetir = useCallback(() => {
    if (resumen) {
      leer(guionDeLectura(resumen, { placa, actualizacion: false }))
    }
  }, [resumen, placa])

  return enCamino && resumen ? repetir : null
}
