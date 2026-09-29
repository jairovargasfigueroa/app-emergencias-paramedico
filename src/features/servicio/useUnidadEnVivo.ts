import { useQuery, useQueryClient } from '@tanstack/react-query'
import { onValue, ref } from 'firebase/database'
import { useEffect } from 'react'

import { atencionActivaQuery, atencionKeys } from '@/features/atencion/queries'
import { baseDatosFirebase } from '@/shared/firebase/baseDatos'

import { servicioActualQuery, servicioKeys } from './queries'

/** Nodo que publica el servidor: un hijo por unidad, que cambia con cualquier novedad de esa unidad. */
const NODO_UNIDADES = 'unidades'

/**
 * Red de seguridad por si una escritura en Firebase falla o el aviso no llega: cada tanto se vuelve a preguntar igual.
 * Solo durante el turno, y TanStack Query lo pausa con la app en segundo plano.
 */
const RESPALDO_MS = 30_000

/**
 * Mantiene al día lo que la app sabe de su unidad aunque lo cambie otro: la central la libera, la saca de servicio o la
 * manda a una emergencia; el sistema le asigna un traslado; el compañero marca un hito desde su teléfono. El nodo de la
 * unidad solo avisa que algo cambió: el detalle se vuelve a pedir a la API, que es la que manda.
 */
export function useUnidadEnVivo(paramedicoId: number) {
  const queryClient = useQueryClient()
  const servicio = useQuery({
    ...servicioActualQuery(paramedicoId),
    refetchInterval: (query) => (query.state.data?.turno ? RESPALDO_MS : false),
  })
  const enTurno = servicio.data?.turno != null
  useQuery({ ...atencionActivaQuery(paramedicoId), enabled: enTurno, refetchInterval: RESPALDO_MS })

  // La unidad asignada, con turno o sin él: la central también la cambia mientras él espera para entrar.
  const ambulanciaId = servicio.data?.ambulancia?.id

  useEffect(() => {
    if (ambulanciaId === undefined) {
      return
    }
    try {
      return onValue(
        ref(baseDatosFirebase(), `${NODO_UNIDADES}/${ambulanciaId}`),
        () => {
          void queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
          void queryClient.invalidateQueries({ queryKey: atencionKeys.activa(paramedicoId) })
          void queryClient.invalidateQueries({ queryKey: atencionKeys.misTraslados })
        },
        () => {
          // Sin permiso para leer el nodo: queda el refresco periódico.
        },
      )
    } catch {
      // Firebase sin configurar en este teléfono: queda el refresco periódico.
      return
    }
  }, [ambulanciaId, paramedicoId, queryClient])
}
