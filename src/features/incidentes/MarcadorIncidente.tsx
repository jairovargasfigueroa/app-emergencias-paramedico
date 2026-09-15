import { Marker } from 'react-native-maps'
import { Text, YStack } from 'tamagui'

import type { IncidenteAbierto } from './api'

type Props = {
  incidente: IncidenteAbierto
  destacado?: boolean
  onPress?: () => void
}

/** Círculo con los afectados reportados: rojo si nadie acude, ámbar si ya acude alguna unidad. */
export function MarcadorIncidente({ incidente, destacado = false, onPress }: Props) {
  const tamano = destacado ? 44 : 36
  return (
    <Marker
      coordinate={{ latitude: incidente.latitud, longitude: incidente.longitud }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
    >
      <YStack
        width={tamano}
        height={tamano}
        rounded={999}
        bg={incidente.unidadesAcudiendo > 0 ? '$enAtencion' : '$primario'}
        borderWidth={destacado ? 4 : 3}
        borderColor="#FFFFFF"
        items="center"
        justify="center"
      >
        <Text color="#FFFFFF" fontSize={destacado ? 16 : 14} fontWeight="600">
          {incidente.cantidadAfectados ?? '?'}
        </Text>
      </YStack>
    </Marker>
  )
}
