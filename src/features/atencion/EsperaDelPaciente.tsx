import Feather from '@expo/vector-icons/Feather'
import { Button, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { horaCorta, tiempoRestante } from '@/shared/formato/tiempo'
import { useAhora } from '@/shared/reloj/useAhora'

type Props = {
  /** Hasta cuándo se espera: lo fija el servidor al avisar que el paciente no estaba listo. */
  esperaHasta: string
  onRetirarse: () => void
}

/**
 * La tolerancia en la puerta, como en cualquier servicio de traslados. Mientras corre, la tripulación espera y puede
 * subir al paciente como siempre; recién cuando se cumple se puede ir sin él. La cuenta avanza de a segundo: es lo
 * que se mira mientras se espera.
 */
export function EsperaDelPaciente({ esperaHasta, onRetirarse }: Props) {
  const tema = useTheme()
  const ahora = useAhora(1000)
  const cumplida = ahora >= new Date(esperaHasta).getTime()

  return (
    <YStack gap={10}>
      <XStack items="center" gap={12} px={14} py={12} rounded={14} borderWidth={1} borderColor="$enAtencion" bg="$enAtencionTinte">
        <Feather name="clock" size={20} color={tema.enAtencionTexto?.val} />
        <YStack flex={1} gap={2}>
          <Text color="$enAtencionTexto" fontSize={15} lineHeight={21} fontWeight="600">
            {cumplida ? `La espera terminó a las ${horaCorta(esperaHasta)}` : `Esperando hasta las ${horaCorta(esperaHasta)}`}
          </Text>
          <Paragraph color="$texto" fontSize={14} lineHeight={20}>
            {cumplida ? 'Puedes seguir esperando o retirarte.' : 'Si sale antes, súbelo como siempre.'}
          </Paragraph>
        </YStack>
        {cumplida ? null : (
          <Text color="$enAtencionTexto" fontFamily="$mono" fontSize={17} fontWeight="500">
            {tiempoRestante(esperaHasta, ahora)}
          </Text>
        )}
      </XStack>

      {/* Se ve desde el principio y se habilita al cumplirse la espera: así se sabe que irse es una opción, y cuándo. */}
      <Button
        height={48}
        rounded={12}
        variant="outlined"
        disabled={!cumplida}
        opacity={cumplida ? 1 : 0.5}
        onPress={onRetirarse}
      >
        <Button.Text color="$texto" fontSize={15} fontWeight="600">
          Retirarse: no estaba listo
        </Button.Text>
      </Button>
    </YStack>
  )
}
