import { useQuery, useQueryClient } from '@tanstack/react-query'
import { onValue, ref } from 'firebase/database'
import { useEffect } from 'react'

import { baseDatosFirebase } from '@/shared/firebase/baseDatos'

import type { ResumenIncidente } from './api'
import { resumenIncidenteQuery, resumenKeys } from './queries'

/** Nodo que publica el servidor: un hijo por incidente con resumen, con su versión y nada del contenido. */
const NODO_RESUMENES = 'resumenes'

/**
 * El resumen del incidente al día mientras la pantalla está abierta. Firebase solo avisa que hay una versión nueva:
 * el contenido se vuelve a pedir a la API, que es la que decide quién puede verlo.
 */
export function useResumenEnVivo(incidenteId: number) {
  const queryClient = useQueryClient()
  const consulta = useQuery(resumenIncidenteQuery(incidenteId))

  useEffect(() => {
    try {
      return onValue(
        ref(baseDatosFirebase(), `${NODO_RESUMENES}/${incidenteId}`),
        (snapshot) => {
          const version: unknown = snapshot.child('version').val()
          const clave = resumenKeys.incidente(incidenteId)
          const conocida = queryClient.getQueryData<ResumenIncidente>(clave)?.version
          // Al suscribirse llega la versión actual: si ya es la que se tiene, o la primera consulta sigue en camino,
          // no hace falta pedirla de nuevo.
          const enCamino = conocida === undefined && queryClient.getQueryState(clave)?.fetchStatus === 'fetching'
          if (typeof version === 'number' && version !== conocida && !enCamino) {
            void queryClient.invalidateQueries({ queryKey: clave })
          }
        },
        () => {
          // Sin permiso para leer el nodo: queda el refresco periódico.
        },
      )
    } catch {
      // Firebase sin configurar en este teléfono: queda el refresco periódico.
      return
    }
  }, [incidenteId, queryClient])

  return consulta
}
