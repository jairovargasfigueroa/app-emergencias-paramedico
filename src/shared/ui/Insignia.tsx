import type { ReactNode } from 'react'
import { Text, XStack } from 'tamagui'

export type TonoInsignia = 'verde' | 'ambar' | 'gris'

const TONOS = {
  verde: { fondo: '$disponibleTinte', texto: '$disponibleTexto', punto: '$disponible' },
  ambar: { fondo: '$enAtencionTinte', texto: '$enAtencionTexto', punto: '$enAtencion' },
  gris: { fondo: '$fueraServicioTinte', texto: '$fueraServicioTexto', punto: '$fueraServicio' },
} as const

type Props = {
  tono: TonoInsignia
  conPunto?: boolean
  alto?: number
  children: ReactNode
}

/** Etiqueta de estado. Tamagui no trae una, así que se arma con sus componentes base. */
export function Insignia({ tono, conPunto = false, alto = 28, children }: Props) {
  const colores = TONOS[tono]
  return (
    <XStack self="flex-start" items="center" gap={6} height={alto} px={alto > 24 ? 12 : 8} rounded={999} bg={colores.fondo}>
      {conPunto ? <XStack width={7} height={7} rounded={999} bg={colores.punto} /> : null}
      <Text color={colores.texto} fontSize={alto > 24 ? 13 : 12} fontWeight="500">
        {children}
      </Text>
    </XStack>
  )
}
