import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'

import { useIncidentesAbiertos } from '@/features/incidentes/incidentesAbiertos'
import { MarcadorIncidente } from '@/features/incidentes/MarcadorIncidente'
import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import type { Ambulancia } from '@/features/servicio/api'
import { EstadoAmbulancia } from '@/features/servicio/EstadoAmbulancia'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import { distanciaEnMetros, formatearDistancia } from '@/shared/formato/distancia'
import { CENTRO_POR_DEFECTO, DELTA_BARRIO, DELTA_CIUDAD, regionAlrededorDe } from '@/shared/mapa/region'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { Atencion, DatosPaciente, MotivoCancelacion } from './api'
import { DialogoCancelar } from './DialogoCancelar'
import { DialogoPaciente } from './DialogoPaciente'
import { HitosAtencion } from './HitosAtencion'
import {
  actualizarPacienteMutation,
  atencionKeys,
  cancelarAtencionMutation,
  marcarLlegadaMutation,
  marcarRecogidaMutation,
} from './queries'

type Props = {
  paramedicoId: number
  atencion: Atencion
  ambulancia: Ambulancia
}

type DialogoAbierto = 'recogida' | 'paciente' | 'cancelar' | null

const MENSAJES_CANCELACION: Record<MotivoCancelacion, string> = {
  AVERIA: 'Tu ambulancia quedó fuera de servicio.',
  NO_SE_ENCONTRO_PACIENTE: 'Tu ambulancia vuelve a estar disponible.',
  DESVIADA: 'Tu ambulancia vuelve a estar disponible.',
  OTRO: 'Tu ambulancia vuelve a estar disponible.',
}

/**
 * PB-05: la atención en curso con sus hitos. Cada hito congela la hora y la ubicación del momento (R2), por eso se
 * envía la posición actual del teléfono.
 */
export function AtencionEnCurso({ paramedicoId, atencion, ambulancia }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()
  const toast = useToastController()
  const posicion = usePosicionActual()
  const { incidentes } = useIncidentesAbiertos()
  const [dialogo, setDialogo] = useState<DialogoAbierto>(null)

  const llegada = useMutation(marcarLlegadaMutation(queryClient))
  const recogida = useMutation(marcarRecogidaMutation(queryClient))
  const paciente = useMutation(actualizarPacienteMutation(queryClient))
  const cancelacion = useMutation(cancelarAtencionMutation(queryClient))

  const incidente = incidentes.find((abierto) => abierto.id === atencion.incidenteId)
  const distancia = posicion && incidente ? formatearDistancia(distanciaEnMetros(posicion, incidente)) : null
  const [regionInicial] = useState(() => {
    const inicio = incidente ?? leerPosicionActual()
    return regionAlrededorDe(inicio ?? CENTRO_POR_DEFECTO, inicio ? DELTA_BARRIO : DELTA_CIUDAD)
  })
  const ocupado = llegada.isPending || recogida.isPending || cancelacion.isPending

  /** Los hitos necesitan la ubicación del momento: sin posición todavía no se pueden marcar. */
  function ubicacionActual() {
    const actual = leerPosicionActual()
    if (!actual) {
      toast.show('Esperando tu ubicación', { message: 'Activa el GPS y vuelve a intentarlo en unos segundos.' })
    }
    return actual
  }

  function avisarError(titulo: string, error: unknown) {
    toast.show(titulo, { message: mensajeDeError(error) })
    // Si la atención cambió en otro lado (transición inválida o ya finalizada), se vuelve a consultar.
    if (error instanceof ErrorApi && error.status === 409) {
      void queryClient.invalidateQueries({ queryKey: atencionKeys.activa(paramedicoId) })
    }
  }

  function marcarLlegada() {
    const ubicacion = ubicacionActual()
    if (!ubicacion) {
      return
    }
    llegada.mutate(
      { paramedicoId, atencionId: atencion.id, ubicacion },
      { onError: (error) => avisarError('No se pudo marcar la llegada', error) },
    )
  }

  function marcarRecogida(datos: DatosPaciente) {
    const ubicacion = ubicacionActual()
    if (!ubicacion) {
      return Promise.resolve()
    }
    return recogida
      .mutateAsync({ paramedicoId, atencionId: atencion.id, datos: { ...ubicacion, ...datos } })
      .then(() => setDialogo(null))
      .catch((error) => avisarError('No se pudo marcar la recogida', error))
  }

  function guardarPaciente(datos: DatosPaciente) {
    return paciente
      .mutateAsync({ paramedicoId, atencionId: atencion.id, datos })
      .then(() => {
        setDialogo(null)
        toast.show('Datos del paciente guardados')
      })
      .catch((error) => avisarError('No se pudieron guardar los datos', error))
  }

  function cancelar(motivo: MotivoCancelacion) {
    cancelacion.mutate(
      { paramedicoId, atencionId: atencion.id, motivo },
      {
        onSuccess: () => {
          setDialogo(null)
          toast.show('Atención cancelada', { message: MENSAJES_CANCELACION[motivo] })
        },
        onError: (error) => {
          setDialogo(null)
          avisarError('No se pudo cancelar la atención', error)
        },
      },
    )
  }

  const accionPrincipal =
    atencion.estado === 'EN_CAMINO'
      ? { texto: 'Marcar llegada', alPresionar: marcarLlegada }
      : atencion.estado === 'EN_EL_LUGAR'
        ? { texto: 'Marcar recogida', alPresionar: () => setDialogo('recogida') }
        : { texto: 'Entregar al paciente', alPresionar: () => router.push('/atencion/entrega') }

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={regionInicial}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={esquema}
      >
        {incidente ? <MarcadorIncidente incidente={incidente} destacado /> : null}
      </MapView>

      <XStack
        position="absolute"
        t={margenes.top + 12}
        l={16}
        r={16}
        items="center"
        justify="space-between"
        gap={12}
        px={14}
        py={12}
        rounded={16}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.12}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={6}
      >
        <YStack gap={2} flex={1} minW={0}>
          <Text color="$textoSecundario" fontSize={13}>
            {`Atención en curso · ${ambulancia.placa}`}
          </Text>
          <Text color="$texto" fontSize={16} fontWeight="600" numberOfLines={1}>
            {distancia ? `Incidente a ${distancia.valor} ${distancia.unidad}` : 'Incidente'}
          </Text>
        </YStack>
        <EstadoAmbulancia estado={ambulancia.estado} />
      </XStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        gap={20}
        px={20}
        pt={24}
        pb={margenes.bottom + 20}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
      >
        <HitosAtencion atencion={atencion} onEditarPaciente={() => setDialogo('paciente')} />

        <YStack gap={10}>
          <BotonPrincipal
            disabled={ocupado}
            opacity={ocupado ? 0.7 : 1}
            icon={llegada.isPending ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={accionPrincipal.alPresionar}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              {accionPrincipal.texto}
            </Button.Text>
          </BotonPrincipal>
          <Button height={48} rounded={14} chromeless disabled={ocupado} onPress={() => setDialogo('cancelar')}>
            <Button.Text color="$primarioPresionado" fontSize={15} fontWeight="500">
              Cancelar atención
            </Button.Text>
          </Button>
        </YStack>
      </YStack>

      <DialogoPaciente
        abierto={dialogo === 'recogida'}
        titulo="Marcar recogida"
        descripcion="Tu ubicación actual queda como punto de recogida. Los datos del paciente son opcionales."
        textoConfirmar="Marcar recogida"
        valoresIniciales={atencion}
        onConfirmar={marcarRecogida}
        onCerrar={() => setDialogo(null)}
      />
      <DialogoPaciente
        abierto={dialogo === 'paciente'}
        titulo="Datos del paciente"
        descripcion="Puedes corregirlos mientras la atención siga activa."
        textoConfirmar="Guardar"
        valoresIniciales={atencion}
        onConfirmar={guardarPaciente}
        onCerrar={() => setDialogo(null)}
      />
      <DialogoCancelar
        abierto={dialogo === 'cancelar'}
        enviando={cancelacion.isPending}
        onConfirmar={cancelar}
        onCerrar={() => setDialogo(null)}
      />
    </YStack>
  )
}
