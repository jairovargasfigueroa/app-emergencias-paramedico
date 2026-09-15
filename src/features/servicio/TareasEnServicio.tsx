import { useQuery } from '@tanstack/react-query'

import { useNotificaciones } from '@/features/notificaciones/useNotificaciones'
import { useEnvioDePosicion } from '@/features/posicion/useEnvioDePosicion'

import { servicioActualQuery } from './queries'

/**
 * Lo que corre mientras hay un paramédico identificado, en cualquier pantalla: el envío de su posición si está en
 * servicio (PB-03 R4) y las notificaciones push de incidentes nuevos (R3). No pinta nada.
 */
export function TareasEnServicio({ paramedicoId }: { paramedicoId: number }) {
  const servicio = useQuery(servicioActualQuery(paramedicoId))
  useEnvioDePosicion(paramedicoId, servicio.data?.enServicio === true)
  useNotificaciones(paramedicoId)
  return null
}
