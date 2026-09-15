import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Button, Paragraph, Spinner, useToastController } from 'tamagui'

import { paramedicoGuardadoQuery, servicioActualQuery } from '@/features/servicio/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { incidenteYaTomado, type IncidenteAbierto, type IncidenteYaTomado } from './api'
import { DialogoSumarse } from './DialogoSumarse'
import { sumarseAIncidenteMutation, tomarIncidenteMutation } from './queries'

/** PB-04 R5: solo una ambulancia disponible y activa puede tomar o sumarse. Explica por qué no. */
function motivoNoDisponible(enServicio: boolean, estado: string | undefined) {
  if (!enServicio) {
    return 'No estás en servicio.'
  }
  if (estado === 'EN_ATENCION') {
    return 'Ya tienes una atención en curso.'
  }
  if (estado === 'FUERA_DE_SERVICIO') {
    return 'Tu ambulancia está fuera de servicio.'
  }
  return null
}

/** PB-04: tomar el incidente o, si otra unidad llegó antes, decidir si sumarse. Nunca se rechaza en silencio. */
export function AccionesTomar({ incidente }: { incidente: IncidenteAbierto }) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const paramedico = useQuery(paramedicoGuardadoQuery()).data
  const servicio = useQuery({ ...servicioActualQuery(paramedico?.id ?? 0), enabled: paramedico != null })
  const tomar = useMutation(tomarIncidenteMutation(queryClient))
  const sumarse = useMutation(sumarseAIncidenteMutation(queryClient))
  const [yaTomado, setYaTomado] = useState<IncidenteYaTomado | null>(null)

  const motivo = servicio.data
    ? motivoNoDisponible(servicio.data.enServicio, servicio.data.ambulancia?.estado)
    : null
  const puedeAcudir = servicio.data !== undefined && motivo === null

  function alAcudir() {
    toast.show('Vas en camino', { message: 'Tu atención quedó registrada.' })
    router.dismissTo('/')
  }

  function tomarIncidente() {
    if (!paramedico) {
      return
    }
    tomar.mutate(
      { paramedicoId: paramedico.id, incidenteId: incidente.id },
      {
        onSuccess: alAcudir,
        onError: (error) => {
          const contexto = incidenteYaTomado(error)
          if (contexto) {
            setYaTomado(contexto)
            return
          }
          toast.show('No se pudo tomar el incidente', { message: mensajeDeError(error) })
        },
      },
    )
  }

  function sumarme() {
    if (!paramedico || !yaTomado) {
      return
    }
    sumarse.mutate(
      { paramedicoId: paramedico.id, incidenteId: yaTomado.incidenteId },
      {
        onSuccess: () => {
          setYaTomado(null)
          alAcudir()
        },
        onError: (error) => {
          setYaTomado(null)
          toast.show('No pudiste sumarte', { message: mensajeDeError(error) })
        },
      },
    )
  }

  return (
    <>
      {motivo ? (
        <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
          {motivo}
        </Paragraph>
      ) : null}
      <BotonPrincipal
        disabled={!puedeAcudir || tomar.isPending}
        opacity={!puedeAcudir || tomar.isPending ? 0.6 : 1}
        icon={tomar.isPending ? <Spinner color="$primarioTexto" /> : undefined}
        onPress={tomarIncidente}
      >
        <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
          {tomar.isPaused ? 'Esperando conexión…' : 'Tomar incidente'}
        </Button.Text>
      </BotonPrincipal>

      <DialogoSumarse
        contexto={yaTomado}
        enviando={sumarse.isPending}
        onSumarse={sumarme}
        onDesistir={() => setYaTomado(null)}
      />
    </>
  )
}
