import { Paragraph, Text, YStack } from 'tamagui'

/**
 * Lo que se dice en un audio o un video, escrito. Va antes del reproductor y en letra grande: en la ambulancia es más
 * fácil leer que escuchar. El servicio de análisis ya enmascara nombres y teléfonos.
 */
export function Transcripcion({ texto }: { texto: string | null | undefined }) {
  if (!texto?.trim()) {
    return (
      <Text color="$textoSecundario" fontSize={15} lineHeight={21}>
        Sin transcripción por ahora: hay que escucharlo.
      </Text>
    )
  }
  return (
    <YStack gap={6} px={14} py={12} rounded={12} bg="$fondo">
      <Text color="$textoSecundario" fontSize={14} fontWeight="600">
        Lo que se dice
      </Text>
      <Paragraph color="$texto" fontSize={18} lineHeight={26}>
        {texto}
      </Paragraph>
    </YStack>
  )
}
