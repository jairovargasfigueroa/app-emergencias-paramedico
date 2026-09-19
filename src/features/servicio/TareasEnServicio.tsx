import { useQuery } from '@tanstack/react-query'

import { useAvisoDeAtencion } from '@/features/notificaciones/useAvisoDeAtencion'
import { useNotificaciones } from '@/features/notificaciones/useNotificaciones'
import { useEnvioDePosicion } from '@/features/posicion/useEnvioDePosicion'

import { servicioActualQuery } from './queries'

/**
 * Lo que corre mientras hay un paramédico identificado, en cualquier pantalla: el envío de su posición mientras esté
 * en turno (PB-03 R4), las notificaciones push de incidentes nuevos (R3) y el aviso fijo de la atención en curso.
 * No pinta nada.
 *
 * La posición va atada al turno y no a la asignación: fuera de su jornada, dónde está el paramédico no es asunto del
 * sistema.
 */
export function TareasEnServicio({ paramedicoId }: { paramedicoId: number }) {
  const servicio = useQuery(servicioActualQuery(paramedicoId))
  const enTurno = servicio.data?.turno != null
  useEnvioDePosicion(paramedicoId, enTurno)
  useNotificaciones(paramedicoId)
  useAvisoDeAtencion(paramedicoId, enTurno)
  return null
}
