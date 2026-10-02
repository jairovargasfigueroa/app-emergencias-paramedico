import { useQuery, useQueryClient } from '@tanstack/react-query'
import { onValue, ref } from 'firebase/database'
import { useEffect } from 'react'

import { baseDatosFirebase } from '@/shared/firebase/baseDatos'

import { esSinAtencion, type ResumenIncidente } from './api'
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
          const estado = queryClient.getQueryState(clave)
          const conocida = queryClient.getQueryData<ResumenIncidente>(clave)?.version
          // Al suscribirse llega la versión actual: si ya es la que se tiene, o la primera consulta sigue en camino,
          // no hace falta pedirla de nuevo.
          const enCamino = conocida === undefined && estado?.fetchStatus === 'fetching'
          // Sin atención en el incidente la API la va a negar igual: una versión nueva no cambia eso.
          const sinAtencion = esSinAtencion(estado?.error)
          if (typeof version === 'number' && version !== conocida && !enCamino && !sinAtencion) {
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
