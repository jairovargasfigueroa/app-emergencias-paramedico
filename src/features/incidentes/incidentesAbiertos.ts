import { onValue, ref } from 'firebase/database'
import { useSyncExternalStore } from 'react'

import { baseDatosFirebase } from '@/shared/firebase/baseDatos'

import type { IncidenteAbierto } from './api'

export type IncidentesAbiertos = {
  cargando: boolean
  error: boolean
  incidentes: IncidenteAbierto[]
}

/** Nodo que publica el servidor: un hijo por incidente `ACTIVO` o `EN_ATENCION`. Al cerrarse, lo retira. */
const NODO_INCIDENTES_ABIERTOS = 'incidentes-abiertos'

const SIN_DATOS: IncidentesAbiertos = { cargando: true, error: false, incidentes: [] }

let actual = SIN_DATOS
const oyentes = new Set<() => void>()
let dejarDeEscuchar: (() => void) | null = null

/**
 * PB-03 R3 y R6: incidentes abiertos en tiempo real. Aparecen, cambian y desaparecen sin refrescar. Hay un único
 * listener de Firebase compartido por todas las pantallas que lo usan.
 */
export function useIncidentesAbiertos() {
  return useSyncExternalStore(suscribir, () => actual)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  if (!dejarDeEscuchar) {
    dejarDeEscuchar = onValue(
      ref(baseDatosFirebase(), NODO_INCIDENTES_ABIERTOS),
      (snapshot) => {
        const incidentes: IncidenteAbierto[] = []
        // Los hijos tienen ids numéricos como clave: se recorren con forEach para no recibir un arreglo con huecos.
        snapshot.forEach((hijo) => {
          incidentes.push(normalizar(hijo.val()))
        })
        publicar({ cargando: false, error: false, incidentes })
      },
      () => publicar({ ...actual, cargando: false, error: true }),
    )
  }
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && dejarDeEscuchar) {
      dejarDeEscuchar()
      dejarDeEscuchar = null
      actual = SIN_DATOS
    }
  }
}

function publicar(siguiente: IncidentesAbiertos) {
  actual = siguiente
  oyentes.forEach((oyente) => oyente())
}

/** Firebase no guarda listas vacías y puede entregar las listas como objeto: se deja siempre un arreglo. */
function normalizar(valor: IncidenteAbierto): IncidenteAbierto {
  const descripciones: unknown = valor.descripciones
  return {
    ...valor,
    descripciones: Array.isArray(descripciones)
      ? descripciones.filter(Boolean)
      : Object.values((descripciones as Record<string, string> | undefined) ?? {}),
    unidadesAcudiendo: valor.unidadesAcudiendo ?? 0,
  }
}
