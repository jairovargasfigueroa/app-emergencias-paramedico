import { useQuery } from '@tanstack/react-query'

import { AvisoDeAtencionRetirada } from '@/features/atencion/AvisoDeAtencionRetirada'
import { useAvisoDeAtencion } from '@/features/notificaciones/useAvisoDeAtencion'
import { useNotificaciones } from '@/features/notificaciones/useNotificaciones'
import { useEnvioDePosicion } from '@/features/posicion/useEnvioDePosicion'
import { useRenovacionDeSesion } from '@/shared/sesion/useRenovacionDeSesion'

import { servicioActualQuery } from './queries'
import { useUnidadEnVivo } from './useUnidadEnVivo'

/**
 * Lo que corre mientras hay un paramédico identificado, en cualquier pantalla: el envío de su posición mientras esté
 * en turno (PB-03 R4), las notificaciones push de incidentes nuevos (R3), el aviso fijo de la atención en curso, lo
 * que otros le cambian a su unidad, que tiene que verse sin salir de la app, y la renovación de la sesión antes de
 * que venza.
 * Lo único que pinta es el aviso de una atención que la unidad ya no tiene, que tiene que verse esté donde esté.
 *
 * La posición va atada al turno y no a la asignación: fuera de su jornada, dónde está el paramédico no es asunto del
 * sistema.
 */
export function TareasEnServicio({ paramedicoId }: { paramedicoId: number }) {
  const servicio = useQuery(servicioActualQuery(paramedicoId))
  const enTurno = servicio.data?.turno != null
  useRenovacionDeSesion()
  useUnidadEnVivo(paramedicoId)
  useEnvioDePosicion(paramedicoId, enTurno)
  useNotificaciones(paramedicoId)
  useAvisoDeAtencion(paramedicoId, enTurno)
  return <AvisoDeAtencionRetirada />
}
