import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { dispositivoQuery, renovarSesionMutation, sesionQuery } from './queries'

/** Con menos de un mes por delante se renueva: la sesión dura meses y así no se corta en medio de un turno. */
const MARGEN_RENOVACION_MS = 30 * 24 * 60 * 60 * 1000

/** Una vez por arranque de la app, no cada vez que se monta quien la usa. */
let revisadaEnEsteArranque = false

function quedaPoco(venceEn: string | null) {
  const vence = venceEn === null ? Number.NaN : Date.parse(venceEn)
  // Sin un vencimiento legible no se sabe cuánto le queda: renovar lo vuelve a saber.
  return Number.isNaN(vence) || vence - Date.now() < MARGEN_RENOVACION_MS
}

/**
 * Al abrir la app con sesión, la renueva si le queda poco. Va por detrás, sin trabar la pantalla: el token nuevo
 * reemplaza al viejo cuando llega. Una sesión de antes de activar el teléfono no tiene clave con qué renovarse: vale
 * hasta que venza, y entonces se entra con el código de la central.
 */
export function useRenovacionDeSesion() {
  const queryClient = useQueryClient()
  const { mutate: renovar } = useMutation(renovarSesionMutation(queryClient))

  useEffect(() => {
    if (revisadaEnEsteArranque) {
      return
    }
    revisadaEnEsteArranque = true
    Promise.all([queryClient.ensureQueryData(sesionQuery()), queryClient.ensureQueryData(dispositivoQuery())])
      .then(([sesion, { claveDispositivo }]) => {
        if (sesion && claveDispositivo && quedaPoco(sesion.venceEn)) {
          renovar(claveDispositivo)
        }
      })
      .catch(() => {
        // Sin sesión legible no hay nada que renovar.
      })
  }, [queryClient, renovar])
}
