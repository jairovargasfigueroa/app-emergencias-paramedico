import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, Vibration, type LayoutChangeEvent } from 'react-native'
import { Text, XStack, YStack, useTheme } from 'tamagui'

/** Cuánto hay que sostener el dedo para que el hito se marque. */
const DURACION_MS = 1000
/** Vibración corta de confirmación, con el Vibration del core de React Native. */
const VIBRACION_MS = 40

type Props = {
  /** Texto del control cuando la acción se puede hacer, p. ej. "Mantén presionado: llegué". */
  texto: string
  /** Motivo escrito en el propio control cuando no se puede hacer, antes de tocarlo. */
  textoApagado?: string
  apagado?: boolean
  /** Si devuelve una promesa que falla, el control se desbloquea para reintentar. */
  onCompletar: () => void | Promise<unknown>
}

/**
 * Confirmación por presión sostenida para lo irreversible: los hitos congelan hora y lugar y no se deshacen. Con
 * guantes o pantalla mojada deslizar falla, y un toque simple se dispara sin querer. Se marca al segundo de sostener;
 * soltar antes lo cancela en silencio.
 */
export function MantenerPresionado({ texto, textoApagado, apagado = false, onCompletar }: Props) {
  const tema = useTheme()
  const progreso = useRef(new Animated.Value(0)).current
  const animacion = useRef<Animated.CompositeAnimation | null>(null)
  const [ancho, setAncho] = useState(0)
  const [presionando, setPresionando] = useState(false)
  // Tras dispararse queda bloqueado: sostener de nuevo no manda una segunda petición.
  const [disparado, setDisparado] = useState(false)

  const bloqueado = apagado || disparado
  const etiqueta = apagado && textoApagado ? textoApagado : texto
  const relleno = presionando || (disparado && !apagado)

  useEffect(() => {
    return () => animacion.current?.stop()
  }, [])

  function reiniciar() {
    animacion.current?.stop()
    animacion.current = null
    progreso.setValue(0)
    setPresionando(false)
    setDisparado(false)
  }

  function disparar() {
    setPresionando(false)
    setDisparado(true)
    Vibration.vibrate(VIBRACION_MS)
    Promise.resolve(onCompletar()).catch(reiniciar)
  }

  function empezar() {
    if (bloqueado || presionando) {
      return
    }
    setPresionando(true)
    const siguiente = Animated.timing(progreso, {
      toValue: 1,
      duration: DURACION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    })
    animacion.current = siguiente
    siguiente.start(({ finished }) => {
      if (finished) {
        disparar()
      }
    })
  }

  /** Soltar antes del segundo cancela en silencio: la barra vuelve a cero y no se avisa nada. */
  function cancelar() {
    if (disparado) {
      return
    }
    animacion.current?.stop()
    animacion.current = null
    progreso.setValue(0)
    setPresionando(false)
  }

  // El teclado sostiene con Enter o espacio, igual que el dedo.
  const conTeclado =
    Platform.OS === 'web'
      ? {
          onKeyDown: (evento: { key: string; repeat?: boolean }) => {
            if ((evento.key === 'Enter' || evento.key === ' ') && !evento.repeat) {
              empezar()
            }
          },
          onKeyUp: () => cancelar(),
        }
      : {}

  const colorTexto = apagado ? '$textoTenue' : relleno ? '$primarioTexto' : '$primarioPresionado'

  return (
    <YStack
      role="button"
      aria-label={etiqueta}
      aria-disabled={bloqueado}
      focusable={!bloqueado}
      // Un lector de pantalla no puede sostener: su doble toque, que ya es deliberado, marca el hito.
      onAccessibilityTap={() => !bloqueado && disparar()}
      height={64}
      rounded={16}
      overflow="hidden"
      borderWidth={1}
      borderColor={apagado ? '$bordeFuerte' : '$primario'}
      bg={apagado ? '$fondo' : '$primarioTinte'}
      justify="center"
      onLayout={(evento: LayoutChangeEvent) => setAncho(evento.nativeEvent.layout.width)}
      onPressIn={empezar}
      onPressOut={cancelar}
      {...conTeclado}
    >
      {apagado ? null : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: tema.primario?.val,
              transform: [
                { translateX: progreso.interpolate({ inputRange: [0, 1], outputRange: [-ancho, 0] }) },
              ],
            },
          ]}
        />
      )}

      <XStack items="center" justify="center" gap={10} px={16}>
        {apagado ? null : (
          <YStack width={22} height={22} rounded={999} borderWidth={2.5} borderColor={colorTexto} items="center" justify="center">
            <Animated.View
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                backgroundColor: relleno ? tema.primarioTexto?.val : tema.primarioPresionado?.val,
                transform: [{ scale: progreso }],
              }}
            />
          </YStack>
        )}
        <Text
          color={colorTexto}
          fontSize={apagado ? 15 : 17}
          lineHeight={apagado ? 20 : 22}
          fontWeight={apagado ? '500' : '600'}
          text="center"
          shrink={1}
        >
          {etiqueta}
        </Text>
      </XStack>
    </YStack>
  )
}
