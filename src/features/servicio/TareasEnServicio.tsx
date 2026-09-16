import { useQuery } from '@tanstack/react-query'

import { useAvisoDeAtencion } from '@/features/notificaciones/useAvisoDeAtencion'
import { useNotificaciones } from '@/features/notificaciones/useNotificaciones'
import { useEnvioDePosicion } from '@/features/posicion/useEnvioDePosicion'

import { servicioActualQuery } from './queries'

/**
 * Lo que corre mientras hay un paramédico identificado, en cualquier pantalla: el envío de su posición si está en
 * servicio (PB-03 R4), las notificaciones push de incidentes nuevos (R3) y el aviso fijo de la atención en curso.
 * No pinta nada.
 */
export function TareasEnServicio({ paramedicoId }: { paramedicoId: number }) {
  const servicio = useQuery(servicioActualQuery(paramedicoId))
  const enServicio = servicio.data?.enServicio === true
  useEnvioDePosicion(paramedicoId, enServicio)
  useNotificaciones(paramedicoId)
  useAvisoDeAtencion(paramedicoId, enServicio)
  return null
}
