import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

import type { Evidencia, MarcaDelVideo } from '@/features/resumen/api'

import { AvisoSinArchivo } from './AvisoSinArchivo'
import { BotonReproducir } from './BotonReproducir'
import { minutosYSegundos } from './formato'
import { Transcripcion } from './Transcripcion'
import { useUrlEvidencia } from './useUrlEvidencia'

/**
 * Video de una alerta: lo escrito arriba, después el video y, si el análisis la trae, la línea de tiempo para saltar a
 * cada momento. La URL se pide recién al tocar "Ver video": no se baja nada que no se vaya a mirar.
 */
export function VideoEvidencia({ evidencia }: { evidencia: Evidencia }) {
  const [pedida, setPedida] = useState(false)
  const archivo = useUrlEvidencia(evidencia.evidenciaId, pedida)
  const marcas = evidencia.lineaDeTiempo ?? []

  return (
    <YStack gap={10}>
      <Transcripcion texto={evidencia.transcripcion} />
      {archivo.error ? (
        <AvisoSinArchivo onReintentar={archivo.reintentar} />
      ) : archivo.url ? (
        <Reproductor
          key={archivo.url}
          url={archivo.url}
          marcas={marcas}
          onCargar={archivo.alCargar}
          onFallar={archivo.alFallarCarga}
        />
      ) : (
        <>
          <BotonReproducir texto="Ver video" cargando={archivo.cargando} onPress={() => setPedida(true)} />
          {marcas.length > 0 ? <LineaDelVideo marcas={marcas} /> : null}
        </>
      )}
    </YStack>
  )
}

type PropsReproductor = {
  url: string
  marcas: MarcaDelVideo[]
  onCargar: () => void
  onFallar: () => void
}

function Reproductor({ url, marcas, onCargar, onFallar }: PropsReproductor) {
  // Arranca solo: el que tocó "Ver video" quiere verlo ya.
  const reproductor = useVideoPlayer(url, (nuevo) => {
    nuevo.play()
  })
  const { status } = useEvent(reproductor, 'statusChange', { status: reproductor.status })

  useEffect(() => {
    if (status === 'readyToPlay') {
      onCargar()
    } else if (status === 'error') {
      onFallar()
    }
  }, [status, onCargar, onFallar])

  function irA(segundo: number) {
    reproductor.currentTime = segundo
    reproductor.play()
  }

  return (
    <YStack gap={10}>
      <YStack height={220} rounded={12} overflow="hidden" bg="black">
        <VideoView
          player={reproductor}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
        />
      </YStack>
      {marcas.length > 0 ? <LineaDelVideo marcas={marcas} onElegir={irA} /> : null}
    </YStack>
  )
}

/** Qué pasa en cada momento del video. Con el video abierto, tocar un momento lo lleva ahí. */
function LineaDelVideo({ marcas, onElegir }: { marcas: MarcaDelVideo[]; onElegir?: (segundo: number) => void }) {
  return (
    <YStack gap={6}>
      <Text color="$textoSecundario" fontSize={14} fontWeight="600">
        Lo que pasa en el video
      </Text>
      {marcas.map((marca, indice) => (
        <Pressable
          key={indice}
          disabled={!onElegir}
          accessibilityRole={onElegir ? 'button' : 'text'}
          onPress={() => onElegir?.(marca.startSecond)}
        >
          <XStack gap={12} py={6}>
            <Text width={48} color={onElegir ? '$primario' : '$textoSecundario'} fontSize={16} fontFamily="$mono">
              {minutosYSegundos(marca.startSecond)}
            </Text>
            <Text flex={1} color="$texto" fontSize={17} lineHeight={24}>
              {marca.text}
            </Text>
          </XStack>
        </Pressable>
      ))}
    </YStack>
  )
}
