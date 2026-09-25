import Feather from '@expo/vector-icons/Feather'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, RadioGroup, Sheet, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { EstadoAtencion, MotivoCancelacion } from './api'

const MOTIVOS: Record<MotivoCancelacion, { titulo: string; detalle?: string }> = {
  AVERIA: { titulo: 'Avería', detalle: 'La ambulancia queda fuera de servicio' },
  NO_SE_ENCONTRO_PACIENTE: { titulo: 'No se encontró al paciente' },
  DESVIADA: { titulo: 'Desviada a otra emergencia' },
  RECHAZADA_POR_PARAMEDICO: { titulo: 'No puedo tomar este traslado', detalle: 'Se le busca otra unidad' },
  CANCELADA_POR_SOLICITANTE: { titulo: 'Lo canceló quien lo pidió' },
  OTRO: { titulo: 'Otro motivo' },
}

/**
 * Motivos que se ofrecen en cada momento. El backend acepta los cuatro en cualquier estado activo (PB-05 R5); la app
 * muestra solo los que tienen sentido: antes de llegar no se sabe si está el paciente, frente a él no se lo deja por
 * otra emergencia y con el paciente a bordo no caben ni "no se encontró" ni "desviada".
 */
const MOTIVOS_POR_ESTADO: Record<EstadoAtencion, MotivoCancelacion[]> = {
  EN_CAMINO: ['AVERIA', 'DESVIADA', 'OTRO'],
  // Ya no se ofrece "no se encontró al paciente": eso es terminar sin trasladar, no cancelar.
  EN_EL_LUGAR: ['AVERIA', 'OTRO'],
  PACIENTE_RECOGIDO: ['AVERIA', 'OTRO'],
  EN_HOSPITAL: ['AVERIA', 'OTRO'],
  // Estados finales: ya no se cancelan (ME-1 A4).
  PACIENTE_ENTREGADO: [],
  SIN_TRASLADO: [],
  CANCELADA: [],
}

/**
 * En un traslado, antes de salir, el paramédico puede devolverlo para que se le busque otra unidad. No aparece
 * una vez que llegó: a esa altura el pedido se resuelve o se termina sin traslado, no se devuelve.
 */
function motivosDisponibles(estado: EstadoAtencion, esTraslado: boolean): MotivoCancelacion[] {
  const base = MOTIVOS_POR_ESTADO[estado]
  return esTraslado && estado === 'EN_CAMINO' ? ['RECHAZADA_POR_PARAMEDICO', ...base] : base
}

type Props = {
  abierto: boolean
  /** Estado de la atención: decide qué motivos se ofrecen. */
  estado: EstadoAtencion
  /** En un traslado se puede devolver el pedido para que se le busque otra unidad. */
  esTraslado?: boolean
  enviando: boolean
  onConfirmar: (motivo: MotivoCancelacion) => void
  onCerrar: () => void
}

/**
 * PB-05 R5 y CA-13: la cancelación exige un motivo; sin elegirlo no se puede confirmar. Todo llega por props: el
 * contenido se pinta en un portal.
 */
export function DialogoCancelar({ abierto, estado, esTraslado = false, enviando, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const [motivo, setMotivo] = useState<MotivoCancelacion | null>(null)

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
            El motivo es obligatorio. Si no queda otra unidad, el incidente vuelve a buscar una.
          </Paragraph>
        </YStack>

        <RadioGroup
          value={motivo ?? ''}
          onValueChange={(valor) => setMotivo(valor as MotivoCancelacion)}
          gap={8}
          aria-label="Motivo de cancelación"
        >
          {motivosDisponibles(estado, esTraslado).map((valor) => {
            const opcion = MOTIVOS[valor]
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
