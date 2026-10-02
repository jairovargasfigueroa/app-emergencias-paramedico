import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useEffect, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'

import type { Evidencia } from '@/features/resumen/api'

import { AvisoSinArchivo } from './AvisoSinArchivo'
import { BotonReproducir } from './BotonReproducir'
import { minutosYSegundos } from './formato'
import { Transcripcion } from './Transcripcion'
import { useUrlEvidencia } from './useUrlEvidencia'

/** Audio de una alerta: primero lo escrito y, debajo, el reproductor. La URL se pide recién al tocar "Escuchar". */
export function AudioEvidencia({ evidencia }: { evidencia: Evidencia }) {
  const [pedida, setPedida] = useState(false)
  const archivo = useUrlEvidencia(evidencia.evidenciaId, pedida)

  return (
    <YStack gap={10}>
      <Transcripcion texto={evidencia.transcripcion} />
      {archivo.error ? (
        <AvisoSinArchivo onReintentar={archivo.reintentar} />
      ) : archivo.url ? (
        <Reproductor key={archivo.url} url={archivo.url} onCargar={archivo.alCargar} onFallar={archivo.alFallarCarga} />
      ) : (
        <BotonReproducir texto="Escuchar audio" cargando={archivo.cargando} onPress={() => setPedida(true)} />
      )}
    </YStack>
  )
}

type PropsReproductor = {
  url: string
  onCargar: () => void
  onFallar: () => void
}

function Reproductor({ url, onCargar, onFallar }: PropsReproductor) {
  const reproductor = useAudioPlayer(url)
  const estado = useAudioPlayerStatus(reproductor)

  // Que suene aunque el iPhone esté en silencio: lo pidió el paramédico al tocar "Escuchar".
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined)
  }, [])

  // El que tocó "Escuchar" quiere oírlo ya: arranca solo apenas carga, una sola vez.
  const [arrancado, setArrancado] = useState(false)
  useEffect(() => {
    if (!estado.isLoaded) {
      return
    }
    onCargar()
    if (!arrancado) {
      setArrancado(true)
      reproductor.play()
    }
  }, [estado.isLoaded, arrancado, onCargar, reproductor])

  useEffect(() => {
    if (estado.error) {
      onFallar()
    }
  }, [estado.error, onFallar])

  const terminado = estado.didJustFinish || (estado.duration > 0 && estado.currentTime >= estado.duration)

  function alternar() {
    if (estado.playing) {
      reproductor.pause()
      return
    }
    if (terminado) {
      void reproductor.seekTo(0)
    }
    reproductor.play()
  }

  return (
    <XStack items="center" gap={12} px={12} py={10} rounded={12} borderWidth={1} borderColor="$borde">
      <BotonReproducir
        texto={estado.playing ? 'Pausar' : 'Reproducir'}
        icono={estado.playing ? 'pause' : 'play'}
        cargando={!estado.isLoaded}
        onPress={alternar}
      />
      <Text flex={1} color="$texto" fontSize={17} fontFamily="$mono" text="right">
        {minutosYSegundos(estado.currentTime)} / {minutosYSegundos(estado.duration)}
      </Text>
    </XStack>
  )
}
