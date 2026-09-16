import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { EstadoAtencion } from '@/features/atencion/api'
import { atencionActivaQuery } from '@/features/atencion/queries'
import { useIncidentesAbiertos } from '@/features/incidentes/incidentesAbiertos'
import { direccionIncidenteQuery } from '@/features/incidentes/queries'

import { mostrarAvisoDeAtencion, quitarAvisoDeAtencion } from './avisoDeAtencion'

type Aviso = { titulo: string; cuerpo: string }

/** A dónde va y qué le toca marcar. El destino es la dirección, no la distancia: cambiaría con cada posición. */
function avisoDe(estado: EstadoAtencion, destino: string): Aviso | null {
  switch (estado) {
    case 'EN_CAMINO':
      return { titulo: `En camino a ${destino}`, cuerpo: 'Toca para volver y marcar tu llegada' }
    case 'EN_EL_LUGAR':
      return { titulo: `En el lugar · ${destino}`, cuerpo: 'Toca para volver y marcar al paciente a bordo' }
    case 'PACIENTE_RECOGIDO':
      return { titulo: 'Paciente a bordo', cuerpo: 'Toca para volver y entregar al paciente' }
    default:
      return null
  }
}

/** Mantiene el aviso fijo al día mientras haya una atención activa, y lo quita cuando termina. */
export function useAvisoDeAtencion(paramedicoId: number, enServicio: boolean) {
  const atencion = useQuery({ ...atencionActivaQuery(paramedicoId), enabled: enServicio }).data
  const { incidentes } = useIncidentesAbiertos()

  const incidente = atencion ? incidentes.find((abierto) => abierto.id === atencion.incidenteId) : undefined
  const direccion = useQuery({
    ...direccionIncidenteQuery(incidente ?? { id: 0, latitud: 0, longitud: 0 }),
    enabled: incidente !== undefined,
  }).data

  const aviso = atencion ? avisoDe(atencion.estado, direccion ?? 'la emergencia') : null
  const titulo = aviso?.titulo ?? null
  const cuerpo = aviso?.cuerpo ?? null

  useEffect(() => {
    if (titulo === null || cuerpo === null) {
      void quitarAvisoDeAtencion()
      return
    }
    void mostrarAvisoDeAtencion(titulo, cuerpo)
  }, [titulo, cuerpo])

  useEffect(() => {
    return () => {
      void quitarAvisoDeAtencion()
    }
  }, [])
}
