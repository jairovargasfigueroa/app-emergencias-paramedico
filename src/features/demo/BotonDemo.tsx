import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useWindowDimensions } from 'react-native'
import { Button, useTheme } from 'tamagui'

import { useSimulador } from './simulador'

/**
 * Entrada al modo demostración, flotando al costado para no tapar nada. Se pinta en rojo mientras hay un recorrido
 * cargado, para que nadie confunda una posición inventada con una real.
 */
export function BotonDemo() {
  const { height } = useWindowDimensions()
  const tema = useTheme()
  const simulador = useSimulador()
  const activo = simulador.recorrido !== null

  return (
    <Button
      position="absolute"
      l={12}
      t={height * 0.45}
      width={44}
      height={44}
      p={0}
      rounded={999}
      bg={activo ? '$primario' : '$superficie'}
      borderColor={activo ? '$primario' : '$borde'}
      opacity={0.95}
      aria-label="Modo demostración"
      onPress={() => router.push('/demo')}
    >
      <Feather name="play" size={18} color={activo ? '#FFFFFF' : tema.textoSecundario?.val} />
    </Button>
  )
}
