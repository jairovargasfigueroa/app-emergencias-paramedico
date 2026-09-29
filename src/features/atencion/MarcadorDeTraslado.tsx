import Feather from '@expo/vector-icons/Feather'
import { Marker } from 'react-native-maps'
import { YStack } from 'tamagui'

import type { PuntoDelTraslado } from './api'

/**
 * El punto del traslado al que va la unidad, con el mismo círculo que un incidente destacado: una persona en el
 * origen, donde espera el paciente, y una bandera en el destino.
 */
export function MarcadorDeTraslado({ punto }: { punto: PuntoDelTraslado }) {
  return (
    <Marker
      coordinate={{ latitude: punto.ubicacion.latitud, longitude: punto.ubicacion.longitud }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={2}
    >
      <YStack
        width={46}
        height={46}
        rounded={999}
        bg="$primario"
        borderWidth={4}
        borderColor="#FFFFFF"
        items="center"
        justify="center"
      >
        <Feather name={punto.tipo === 'origen' ? 'user' : 'flag'} size={20} color="#FFFFFF" />
      </YStack>
    </Marker>
  )
}
