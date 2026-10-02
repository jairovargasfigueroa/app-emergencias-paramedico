import { Paragraph, Text, XStack, YStack } from 'tamagui'

import type { NivelGravedad, ResumenIa } from './api'
import { textoGravedad } from './textos'

// `undetermined` va en gris y nunca en verde: no saber la gravedad no es lo mismo que una gravedad baja.
const COLORES = {
  high: { fondo: '$primario', texto: '$primarioTexto', punto: '$primarioTexto' },
  moderate: { fondo: '$enAtencionTinte', texto: '$enAtencionTexto', punto: '$enAtencion' },
  low: { fondo: '$disponibleTinte', texto: '$disponibleTexto', punto: '$disponible' },
  undetermined: { fondo: '$fueraServicioTinte', texto: '$fueraServicioTexto', punto: '$fueraServicio' },
} as const satisfies Record<NivelGravedad, unknown>

/** Gravedad preliminar en una etiqueta de color y, al lado, la primera razón que dio la IA para ponerla. */
export function GravedadPreliminar({ gravedad }: { gravedad: ResumenIa['severity'] }) {
  const colores = COLORES[gravedad.level] ?? COLORES.undetermined
  const razon = gravedad.basis[0]

  return (
    <YStack gap={8}>
      <XStack self="flex-start" items="center" gap={8} height={36} px={14} rounded={999} bg={colores.fondo}>
        <XStack width={9} height={9} rounded={999} bg={colores.punto} />
        <Text color={colores.texto} fontSize={16} fontWeight="600">
          {textoGravedad(gravedad.level)}
        </Text>
      </XStack>
      {razon ? (
        <Paragraph color="$texto" fontSize={16} lineHeight={23}>
          {razon}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
