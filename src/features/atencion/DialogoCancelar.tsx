import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, RadioGroup, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { MotivoCancelacion } from './api'

const MOTIVOS: { valor: MotivoCancelacion; titulo: string; detalle?: string }[] = [
  { valor: 'AVERIA', titulo: 'Avería', detalle: 'La ambulancia queda fuera de servicio' },
  { valor: 'NO_SE_ENCONTRO_PACIENTE', titulo: 'No se encontró al paciente' },
  { valor: 'DESVIADA', titulo: 'Desviada a otra emergencia' },
  { valor: 'OTRO', titulo: 'Otro motivo' },
]

type Props = {
  abierto: boolean
  enviando: boolean
  onConfirmar: (motivo: MotivoCancelacion) => void
  onCerrar: () => void
}

/**
 * PB-05 R5 y CA-13: la cancelación exige un motivo; sin elegirlo no se puede confirmar. Todo llega por props: el
 * contenido se pinta en un portal.
 */
export function DialogoCancelar({ abierto, enviando, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
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
          {MOTIVOS.map((opcion) => {
            const elegido = motivo === opcion.valor
            const id = `motivo-${opcion.valor}`
            return (
              <XStack
                key={opcion.valor}
                items="center"
                gap={12}
                minH={52}
                px={14}
                py={12}
                rounded={14}
                borderWidth={elegido ? 2 : 1}
                borderColor={elegido ? '$primario' : '$borde'}
                onPress={() => setMotivo(opcion.valor)}
              >
                <RadioGroup.Item value={opcion.valor} id={id} size="$4" borderColor={elegido ? '$primario' : '$bordeFuerte'}>
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
