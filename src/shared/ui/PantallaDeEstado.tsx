import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H2, Paragraph, Spinner, YStack } from 'tamagui'

type Props = {
  titulo?: string
  descripcion?: string
  cargando?: boolean
  children?: ReactNode
}

/** Pantalla completa para esperas, errores y estados vacíos, con acciones opcionales debajo. */
export function PantallaDeEstado({ titulo, descripcion, cargando = false, children }: Props) {
  const margenes = useSafeAreaInsets()
  return (
    <YStack flex={1} bg="$fondo" items="center" justify="center" gap={16} px={32} pt={margenes.top} pb={margenes.bottom}>
      {cargando ? <Spinner size="large" color="$primario" /> : null}
      {titulo || descripcion ? (
        <YStack items="center" gap={8}>
          {titulo ? (
            <H2 color="$texto" fontSize={22} lineHeight={28} fontWeight="600" text="center">
              {titulo}
            </H2>
          ) : null}
          {descripcion ? (
            <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22} text="center">
              {descripcion}
            </Paragraph>
          ) : null}
        </YStack>
      ) : null}
      {children ? (
        <YStack self="stretch" gap={10}>
          {children}
        </YStack>
      ) : null}
    </YStack>
  )
}
