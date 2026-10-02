import Feather from '@expo/vector-icons/Feather'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Spinner, YStack } from 'tamagui'

import { AvisoSinArchivo } from './AvisoSinArchivo'
import { useUrlEvidencia } from './useUrlEvidencia'

/**
 * Foto de una alerta. La URL se pide al mostrarla y la imagen queda solo en memoria: es un archivo del ciudadano y no
 * tiene por qué quedar guardado en el teléfono. Al tocarla se abre a pantalla completa.
 */
export function FotoEvidencia({ evidenciaId }: { evidenciaId: number }) {
  const { url, cargando, error, alFallarCarga, alCargar, reintentar } = useUrlEvidencia(evidenciaId)
  const [ampliada, setAmpliada] = useState(false)

  if (error) {
    return <AvisoSinArchivo onReintentar={reintentar} />
  }

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Foto enviada en la alerta. Toca para ampliarla."
        disabled={!url}
        onPress={() => setAmpliada(true)}
      >
        <YStack height={200} rounded={12} overflow="hidden" bg="$fondo" items="center" justify="center">
          {cargando || !url ? (
            <Spinner color="$primario" />
          ) : (
            <Image
              source={{ uri: url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory"
              transition={150}
              onLoad={alCargar}
              onError={alFallarCarga}
            />
          )}
        </YStack>
      </Pressable>

      {url ? <FotoAmpliada url={url} visible={ampliada} onCerrar={() => setAmpliada(false)} /> : null}
    </>
  )
}

function FotoAmpliada({ url, visible, onCerrar }: { url: string; visible: boolean; onCerrar: () => void }) {
  const margenes = useSafeAreaInsets()
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <YStack flex={1} bg="black">
        <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="contain" cachePolicy="memory" />
        <Button
          position="absolute"
          t={margenes.top + 12}
          r={16}
          width={48}
          height={48}
          p={0}
          rounded={999}
          bg="rgba(0, 0, 0, 0.6)"
          borderWidth={0}
          aria-label="Cerrar la foto"
          onPress={onCerrar}
        >
          <Feather name="x" size={24} color="white" />
        </Button>
      </YStack>
    </Modal>
  )
}
