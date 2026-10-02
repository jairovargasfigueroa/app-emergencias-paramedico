import { Paragraph } from 'tamagui'

/** La API no da los archivos a quien no atiende el incidente: no es una falla, así que no hay nada que reintentar. */
export function AvisoSinAtencion() {
  return (
    <Paragraph px={14} py={10} rounded={12} bg="$fondo" color="$textoSecundario" fontSize={16} lineHeight={22}>
      Las fotos, audios y videos se ven cuando tu unidad atiende este incidente.
    </Paragraph>
  )
}
