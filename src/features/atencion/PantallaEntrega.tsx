import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Button,
  H1,
  Label,
  Paragraph,
  RadioGroup,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
  useTheme,
  useToastController,
} from 'tamagui'

import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import { paramedicoGuardadoQuery } from '@/features/servicio/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MantenerPresionado } from '@/shared/ui/MantenerPresionado'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import { atencionActivaQuery, centrosSaludQuery, entregarMutation } from './queries'

const OTRO_DESTINO = 'otro'
const LARGO_MAXIMO_DESCRIPCION = 2000

function volver() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

/**
 * PB-05 R4, CA-09 y CA-10: la entrega registra siempre la ubicación actual. El centro de salud es una referencia
 * opcional y la descripción cubre destinos no catalogados: la entrega nunca se bloquea por el catálogo.
 */
export function PantallaEntrega() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const paramedico = useQuery(paramedicoGuardadoQuery()).data
  const atencion = useQuery({ ...atencionActivaQuery(paramedico?.id ?? 0), enabled: paramedico != null })
  const centros = useQuery(centrosSaludQuery())
  const entregar = useMutation(entregarMutation(queryClient))
  const sinPosicion = usePosicionActual() === null

  const [destino, setDestino] = useState<string>('')
  const [descripcion, setDescripcion] = useState('')

  if (atencion.isPending) {
    return <PantallaDeEstado cargando />
  }

  if (!paramedico || !atencion.data || atencion.data.estado !== 'PACIENTE_RECOGIDO') {
    return (
      <PantallaDeEstado titulo="No hay un paciente por entregar" descripcion="La entrega se marca después de la recogida.">
        <BotonPrincipal onPress={volver}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Volver
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  const atencionId = atencion.data.id
  const paramedicoId = paramedico.id

  function marcarEntrega() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    const texto = descripcion.trim()
    return entregar
      .mutateAsync({
        paramedicoId,
        atencionId,
        datos: {
          ...ubicacion,
          centroSaludId: destino && destino !== OTRO_DESTINO ? Number(destino) : undefined,
          destinoDescripcion: texto.length > 0 ? texto : undefined,
        },
      })
      .then((entregada) => {
        // Los tres tiempos del servicio vienen en la respuesta: el cierre los muestra sin volver a consultar.
        router.replace({
          pathname: '/atencion/cierre',
          params: {
            llegada: entregada.horaLlegada ?? '',
            recogida: entregada.horaRecogida ?? '',
            entrega: entregada.horaEntrega ?? '',
          },
        })
      })
      .catch((error: unknown) => {
        toast.show('No se pudo marcar la entrega', { message: mensajeDeError(error) })
        // Se vuelve a lanzar para que el control se desbloquee y pueda reintentarse.
        throw error
      })
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <YStack flex={1} bg="$fondo" pt={margenes.top + 8} pb={margenes.bottom + 20}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
          <Button self="flex-start" chromeless px={0} onPress={volver} icon={<Feather name="chevron-left" size={20} color={tema.texto?.val} />}>
            <Button.Text color="$texto" fontSize={15} fontWeight="500">
              Atención en curso
            </Button.Text>
          </Button>

          <YStack gap={6}>
            <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
              Entregar al paciente
            </H1>
            <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
              Tu ubicación actual queda como punto de entrega.
            </Paragraph>
          </YStack>

          <YStack gap={10}>
            <Text color="$texto" fontSize={14} fontWeight="600">
              Destino
            </Text>

            {centros.isPending ? (
              <XStack items="center" gap={10} py={12}>
                <Spinner color="$primario" />
                <Paragraph color="$textoSecundario" fontSize={14}>
                  Cargando centros de salud…
                </Paragraph>
              </XStack>
            ) : null}
            {centros.isError ? (
              <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
                No pudimos cargar los centros de salud. Puedes entregar igual describiendo el destino.
              </Paragraph>
            ) : null}

            <RadioGroup value={destino} onValueChange={setDestino} gap={10} aria-label="Destino de la entrega">
              {[
                ...(centros.data ?? []).map((centro) => ({
                  valor: String(centro.id),
                  titulo: centro.nombre,
                  detalle: centro.direccion,
                })),
                { valor: OTRO_DESTINO, titulo: 'Otro destino', detalle: null },
              ].map((opcion) => {
                const elegido = destino === opcion.valor
                const id = `destino-${opcion.valor}`
                return (
                  <XStack
                    key={opcion.valor}
                    items="center"
                    gap={12}
                    p={14}
                    rounded={14}
                    borderWidth={elegido ? 2 : 1}
                    borderColor={elegido ? '$primario' : '$borde'}
                    bg="$superficie"
                    onPress={() => setDestino(opcion.valor)}
                  >
                    <RadioGroup.Item value={opcion.valor} id={id} size="$4" borderColor={elegido ? '$primario' : '$bordeFuerte'}>
                      <RadioGroup.Indicator bg="$primario" />
                    </RadioGroup.Item>
                    <YStack flex={1} gap={2}>
                      <Label htmlFor={id} color="$texto" fontSize={15} lineHeight={20} fontWeight={elegido ? '600' : '500'}>
                        {opcion.titulo}
                      </Label>
                      {opcion.detalle ? (
                        <Text color="$textoSecundario" fontSize={13}>
                          {opcion.detalle}
                        </Text>
                      ) : null}
                    </YStack>
                  </XStack>
                )
              })}
            </RadioGroup>

            <TextArea
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Descripción del destino (opcional). Ej.: casa del paciente"
              placeholderTextColor="$textoTenue"
              maxLength={LARGO_MAXIMO_DESCRIPCION}
              minH={52}
              rounded={12}
              fontSize={15}
              bg="$superficie"
              borderColor="$borde"
              aria-label="Descripción del destino"
            />
          </YStack>
        </ScrollView>

        {/* Último hito irreversible del servicio: se confirma sosteniendo, igual que la llegada y la recogida. */}
        <YStack px={20} pt={12}>
          <MantenerPresionado
            texto="Mantén presionado: entregado"
            apagado={sinPosicion}
            textoApagado="Esperando tu ubicación para poder marcar la entrega"
            onCompletar={marcarEntrega}
          />
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}
