import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { tituloDelLugar } from '@/features/incidentes/direcciones'
import { useIncidentesAbiertos } from '@/features/incidentes/incidentesAbiertos'
import { MarcadorIncidente } from '@/features/incidentes/MarcadorIncidente'
import { direccionIncidenteQuery } from '@/features/incidentes/queries'
import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import { distanciaEnMetros, formatearDistancia } from '@/shared/formato/distancia'
import { CENTRO_POR_DEFECTO, DELTA_BARRIO, DELTA_CIUDAD, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MantenerPresionado } from '@/shared/ui/MantenerPresionado'

import type { Atencion, MotivoCancelacion } from './api'
import { DialogoCancelar } from './DialogoCancelar'
import { HitosAtencion } from './HitosAtencion'
import { MenuAtencion } from './MenuAtencion'
import { TarjetaDeAtencion } from './TarjetaDeAtencion'
import { atencionKeys, cancelarAtencionMutation, marcarLlegadaMutation, marcarRecogidaMutation } from './queries'

type Props = {
  paramedicoId: number
  atencion: Atencion
}

const MENSAJES_CANCELACION: Record<MotivoCancelacion, string> = {
  AVERIA: 'Tu ambulancia quedó fuera de servicio.',
  NO_SE_ENCONTRO_PACIENTE: 'Tu ambulancia vuelve a estar disponible.',
  DESVIADA: 'Tu ambulancia vuelve a estar disponible.',
  OTRO: 'Tu ambulancia vuelve a estar disponible.',
}

/**
 * PB-05: la atención en curso. Cada hito congela la hora y la ubicación del momento (R2) y no se deshace, así que se
 * confirma manteniendo presionado. Lo reversible se sigue tocando.
 */
export function AtencionEnCurso({ paramedicoId, atencion }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const posicion = usePosicionActual()
  const ahora = useAhora()
  const { incidentes } = useIncidentesAbiertos()
  const [detallesAbiertos, setDetallesAbiertos] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const llegada = useMutation(marcarLlegadaMutation(queryClient))
  const recogida = useMutation(marcarRecogidaMutation(queryClient))
  const cancelacion = useMutation(cancelarAtencionMutation(queryClient))

  const incidente = incidentes.find((abierto) => abierto.id === atencion.incidenteId)
  const direccion = useQuery({
    ...direccionIncidenteQuery(incidente ?? { id: atencion.incidenteId, latitud: 0, longitud: 0 }),
    enabled: incidente !== undefined,
  }).data
  const distancia = posicion && incidente ? formatearDistancia(distanciaEnMetros(posicion, incidente)) : null
  const lugar = tituloDelLugar(direccion, distancia)

  const [regionInicial] = useState(() => {
    const inicio = incidente ?? leerPosicionActual()
    return regionAlrededorDe(inicio ?? CENTRO_POR_DEFECTO, inicio ? DELTA_BARRIO : DELTA_CIUDAD)
  })

  function avisarError(titulo: string, error: unknown) {
    toast.show(titulo, { message: mensajeDeError(error) })
    // Si la atención cambió en otro lado (transición inválida o ya finalizada), se vuelve a consultar.
    if (error instanceof ErrorApi && error.status === 409) {
      void queryClient.invalidateQueries({ queryKey: atencionKeys.activa(paramedicoId) })
    }
  }

  /** Si la petición falla, se vuelve a lanzar para que el control se desbloquee y pueda reintentarse. */
  function alFallar(titulo: string) {
    return (error: unknown) => {
      avisarError(titulo, error)
      throw error
    }
  }

  function marcarLlegada() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    return llegada
      .mutateAsync({ paramedicoId, atencionId: atencion.id, ubicacion })
      .catch(alFallar('No se pudo marcar la llegada'))
  }

  /** PB-05 CA-02: la recogida solo necesita la ubicación. Los datos del paciente son opcionales y van aparte (R3). */
  function marcarRecogida() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    return recogida
      .mutateAsync({ paramedicoId, atencionId: atencion.id, datos: ubicacion })
      .catch(alFallar('No se pudo marcar la recogida'))
  }

  function cancelar(motivo: MotivoCancelacion) {
    cancelacion.mutate(
      { paramedicoId, atencionId: atencion.id, motivo },
      {
        onSuccess: () => {
          setCancelando(false)
          toast.show('Atención cancelada', { message: MENSAJES_CANCELACION[motivo] })
        },
        onError: (error) => {
          setCancelando(false)
          avisarError('No se pudo cancelar la atención', error)
        },
      },
    )
  }

  const sinPosicion = posicion === null
  const conPaciente = [atencion.nombrePaciente, atencion.documentoPaciente].filter(Boolean).join(' · ')

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

      <YStack position="absolute" t={margenes.top + 12} l={16} r={16}>
        <TarjetaDeAtencion
          atencion={atencion}
          lugar={lugar}
          distancia={distancia}
          unidadesAcudiendo={incidente?.unidadesAcudiendo ?? 1}
          ahora={ahora}
        />
      </YStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        gap={12}
        px={16}
        pt={12}
        pb={margenes.bottom + 16}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
      >
        <YStack self="center" width={40} height={5} rounded={999} bg="$bordeFuerte" />

        {atencion.estado === 'EN_CAMINO' ? (
          <MantenerPresionado
            texto="Mantén presionado: llegué"
            apagado={sinPosicion}
            textoApagado="Esperando tu ubicación para poder marcar la llegada"
            onCompletar={marcarLlegada}
          />
        ) : null}

        {atencion.estado === 'EN_EL_LUGAR' ? (
          <>
            <MantenerPresionado
              texto="Mantén presionado: paciente a bordo"
              apagado={sinPosicion}
              textoApagado="Esperando tu ubicación para poder marcar la recogida"
              onCompletar={marcarRecogida}
            />
            <Tarea
              texto={conPaciente || 'Datos del paciente · opcional'}
              accion={conPaciente ? 'Editar' : 'Agregar'}
              onPress={() => router.push('/atencion/paciente')}
            />
          </>
        ) : null}

        {atencion.estado === 'PACIENTE_RECOGIDO' ? (
          <>
            <BotonPrincipal onPress={() => router.push('/atencion/entrega')}>
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                Entregar al paciente
              </Button.Text>
            </BotonPrincipal>
            <Tarea
              texto={conPaciente || 'Falta anotar al paciente'}
              destacada={!conPaciente}
              accion={conPaciente ? 'Editar' : 'Agregar'}
              onPress={() => router.push('/atencion/paciente')}
            />
          </>
        ) : null}

        {detallesAbiertos ? (
          <YStack gap={14} px={4} pt={4}>
            <YStack gap={6}>
              <Text color="$texto" fontSize={14} fontWeight="600">
                Lo que reportaron
              </Text>
              <Paragraph color="$textoSecundario" fontSize={15} lineHeight={21}>
                {incidente?.descripciones[0] ?? 'Todavía no dijeron qué pasó.'}
              </Paragraph>
            </YStack>
            <HitosAtencion atencion={atencion} />
          </YStack>
        ) : null}

        <XStack items="center" justify="space-between" gap={10}>
          <Button chromeless px={4} height={40} onPress={() => setDetallesAbiertos((abierto) => !abierto)}>
            <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
              {detallesAbiertos ? 'Ocultar detalles' : 'Ver detalles del incidente'}
            </Button.Text>
          </Button>
          <Button
            width={40}
            height={40}
            p={0}
            rounded={12}
            bg="$superficie"
            borderColor="$borde"
            aria-label="Más opciones"
            onPress={() => setMenuAbierto(true)}
          >
            <Feather name="more-vertical" size={18} color={tema.textoSecundario?.val} />
          </Button>
        </XStack>
      </YStack>

      <MenuAtencion
        abierto={menuAbierto}
        onCancelarAtencion={() => {
          setMenuAbierto(false)
          setCancelando(true)
        }}
        onCerrar={() => setMenuAbierto(false)}
      />
      <DialogoCancelar
        abierto={cancelando}
        estado={atencion.estado}
        enviando={cancelacion.isPending}
        onConfirmar={cancelar}
        onCerrar={() => setCancelando(false)}
      />
    </YStack>
  )
}

/** Fila discreta con algo pendiente y opcional, sin robarle sitio al paso siguiente. */
function Tarea({
  texto,
  accion,
  destacada = false,
  onPress,
}: {
  texto: string
  accion: string
  destacada?: boolean
  onPress: () => void
}) {
  return (
    <XStack items="center" justify="space-between" gap={10} px={12} py={11} rounded={12} bg="$fondo" borderWidth={1} borderColor="$borde">
      <Text color={destacada ? '$texto' : '$textoSecundario'} fontSize={15} fontWeight={destacada ? '600' : '400'} numberOfLines={1} flex={1}>
        {texto}
      </Text>
      <Button size="$2" chromeless onPress={onPress}>
        <Button.Text color="$primarioPresionado" fontSize={15} fontWeight="600">
          {accion}
        </Button.Text>
      </Button>
    </XStack>
  )
}
