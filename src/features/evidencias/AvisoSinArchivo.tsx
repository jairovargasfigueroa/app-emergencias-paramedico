import { Button, Paragraph, XStack } from 'tamagui'

/** El archivo no cargó ni con una URL nueva: se ofrece probar de nuevo a mano. */
export function AvisoSinArchivo({ onReintentar }: { onReintentar: () => void }) {
  return (
    <XStack items="center" justify="space-between" gap={12} px={14} py={10} rounded={12} bg="$fondo">
      <Paragraph flex={1} color="$textoSecundario" fontSize={16} lineHeight={22}>
        No se pudo abrir el archivo.
      </Paragraph>
      <Button height={40} rounded={10} bg="$superficie" borderColor="$bordeFuerte" onPress={onReintentar}>
        <Button.Text color="$texto" fontSize={15} fontWeight="500">
          Reintentar
        </Button.Text>
      </Button>
    </XStack>
  )
}
