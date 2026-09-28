import Feather from '@expo/vector-icons/Feather'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, RadioGroup, Sheet, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { EstadoAtencion, MotivoCancelacionPropio } from './api'

/**
 * Lo que se ofrece al cancelar. "No se encontró al paciente" ya no está: eso es terminar sin trasladar. Devolver un
 * traslado tampoco: tiene su propio botón mientras la unidad va en camino.
 */
type MotivoOfrecido = Extract<MotivoCancelacionPropio, 'AVERIA' | 'DESVIADA' | 'OTRO'>

type Opcion = { titulo: string; detalle?: string }

const MOTIVOS_EMERGENCIA: Record<MotivoOfrecido, Opcion> = {
  AVERIA: { titulo: 'Avería', detalle: 'La ambulancia queda fuera de servicio' },
  DESVIADA: { titulo: 'Desviada a otra emergencia' },
  OTRO: { titulo: 'Otro motivo' },
}

/** En un traslado se cuenta qué le pasó a la unidad, como lo diría la tripulación a la central. */
const MOTIVOS_TRASLADO: Record<MotivoOfrecido, Opcion> = {
  AVERIA: { titulo: 'La unidad se averió', detalle: 'La ambulancia queda fuera de servicio' },
  DESVIADA: { titulo: 'Me desviaron a otra urgencia' },
  OTRO: { titulo: 'Otro motivo' },
}

/**
 * Motivos que se ofrecen en una emergencia en cada momento. El backend acepta más; la app muestra solo los que tienen
 * sentido: frente al paciente no se lo deja por otra emergencia y con el paciente a bordo no cabe "desviada".
 */
const POR_ESTADO_EMERGENCIA: Record<EstadoAtencion, MotivoOfrecido[]> = {
  EN_CAMINO: ['AVERIA', 'DESVIADA', 'OTRO'],
  EN_EL_LUGAR: ['AVERIA', 'OTRO'],
  PACIENTE_RECOGIDO: ['AVERIA', 'OTRO'],
  EN_HOSPITAL: ['AVERIA', 'OTRO'],
  // Estados finales: ya no se cancelan (ME-1 A4).
  PACIENTE_ENTREGADO: [],
  SIN_TRASLADO: [],
  CANCELADA: [],
}

/**
 * En un traslado, lo que acepta el backend: a la unidad la pueden desviar a algo más urgente hasta que sube al
 * paciente, también ya en la puerta. Con el paciente a bordo, solo queda que se averíe u otro motivo.
 */
const POR_ESTADO_TRASLADO: Record<EstadoAtencion, MotivoOfrecido[]> = {
  EN_CAMINO: ['AVERIA', 'DESVIADA', 'OTRO'],
  EN_EL_LUGAR: ['AVERIA', 'DESVIADA', 'OTRO'],
  PACIENTE_RECOGIDO: ['AVERIA', 'OTRO'],
  EN_HOSPITAL: ['AVERIA', 'OTRO'],
  PACIENTE_ENTREGADO: [],
  SIN_TRASLADO: [],
  CANCELADA: [],
}

type Props = {
  abierto: boolean
  /** Estado de la atención: decide qué motivos se ofrecen. */
  estado: EstadoAtencion
  /** En un traslado cambian los motivos que valen y cómo se dicen. */
  esTraslado?: boolean
  enviando: boolean
  onConfirmar: (motivo: MotivoCancelacionPropio) => void
  onCerrar: () => void
}

/**
 * PB-05 R5 y CA-13: la cancelación exige un motivo; sin elegirlo no se puede confirmar. Todo llega por props: el
 * contenido se pinta en un portal.
 */
export function DialogoCancelar({ abierto, estado, esTraslado = false, enviando, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const [motivo, setMotivo] = useState<MotivoOfrecido | null>(null)
  const motivos = (esTraslado ? POR_ESTADO_TRASLADO : POR_ESTADO_EMERGENCIA)[estado]
  const opciones = esTraslado ? MOTIVOS_TRASLADO : MOTIVOS_EMERGENCIA

  useEffect(() => {
    if (abierto) {
      setMotivo(null)
    }
  }, [abierto])

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !enviando) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!enviando}
    >
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={18}
        px={20}
        pt={24}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        {/* Con el paciente a bordo, el aviso va antes de todo: se lee antes de elegir el motivo. */}
        {estado === 'PACIENTE_RECOGIDO' ? (
          <XStack gap={12} px={14} py={12} rounded={14} borderWidth={1} borderColor="$enAtencion" bg="$enAtencionTinte">
            <Feather name="alert-triangle" size={20} color={tema.enAtencionTexto?.val} />
            <YStack flex={1} gap={2}>
              <Text color="$enAtencionTexto" fontSize={16} lineHeight={22} fontWeight="600">
                Tienes un paciente a bordo
              </Text>
              <Paragraph color="$texto" fontSize={14} lineHeight={20}>
                Cancela solo si la ambulancia no puede seguir o si otra unidad se hará cargo.
              </Paragraph>
            </YStack>
          </XStack>
        ) : null}

        <YStack gap={6}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            Cancelar atención
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {esTraslado
              ? 'El motivo es obligatorio. El traslado vuelve a la cola y se le busca otra unidad.'
              : 'El motivo es obligatorio. Si no queda otra unidad, el incidente vuelve a buscar una.'}
          </Paragraph>
        </YStack>

        <RadioGroup
          value={motivo ?? ''}
          onValueChange={(valor) => setMotivo(valor as MotivoOfrecido)}
          gap={8}
          aria-label="Motivo de cancelación"
        >
          {motivos.map((valor) => {
            const opcion = opciones[valor]
            const elegido = motivo === valor
            const id = `motivo-${valor}`
            return (
              <XStack
                key={valor}
                items="center"
                gap={12}
                minH={52}
                px={14}
                py={12}
                rounded={14}
                borderWidth={elegido ? 2 : 1}
                borderColor={elegido ? '$primario' : '$borde'}
                onPress={() => setMotivo(valor)}
              >
                <RadioGroup.Item value={valor} id={id} size="$4" borderColor={elegido ? '$primario' : '$bordeFuerte'}>
                  <RadioGroup.Indicator bg="$primario" />
                </RadioGroup.Item>
                <YStack flex={1} gap={2}>
                  <Label htmlFor={id} color="$texto" fontSize={15} lineHeight={20} fontWeight={elegido ? '600' : '500'}>
                    {opcion.titulo}
                  </Label>
                  {opcion.detalle ? (
                    <Text color="$enAtencionTexto" fontSize={13}>
                      {opcion.detalle}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>
            )
          })}
        </RadioGroup>

        <YStack gap={10}>
          <BotonPrincipal
            disabled={!motivo || enviando}
            opacity={!motivo || enviando ? 0.6 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={() => motivo && onConfirmar(motivo)}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Cancelar atención
            </Button.Text>
          </BotonPrincipal>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
