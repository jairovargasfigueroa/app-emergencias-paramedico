import { Marker } from 'react-native-maps'
import { Text, YStack } from 'tamagui'

import type { IncidenteAbierto } from './api'

type Props = {
  incidente: IncidenteAbierto
  /** Marcador agrandado: el seleccionado en la lista, o el único de la pantalla. */
  destacado?: boolean
  /** Lleva demasiado tiempo sin que nadie acuda: mismo tono de aviso que su tarjeta. */
  abandonado?: boolean
  onPress?: () => void
}

/** Círculo con los afectados reportados. Ámbar cuando la emergencia lleva demasiado tiempo sin unidades. */
export function MarcadorIncidente({ incidente, destacado = false, abandonado = false, onPress }: Props) {
  const tamano = destacado ? 46 : 36
  return (
    <Marker
      coordinate={{ latitude: incidente.latitud, longitude: incidente.longitud }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={destacado ? 2 : 1}
      onPress={onPress}
    >
      <YStack
        width={tamano}
        height={tamano}
        rounded={999}
        bg={abandonado ? '$enAtencion' : '$primario'}
        borderWidth={destacado ? 4 : 3}
        borderColor="#FFFFFF"
        items="center"
        justify="center"
      >
        <Text color="#FFFFFF" fontSize={destacado ? 17 : 14} fontWeight="600">
          {incidente.cantidadAfectados ?? '?'}
        </Text>
      </YStack>
    </Marker>
  )
}
