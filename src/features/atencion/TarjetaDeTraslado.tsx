import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Text, XStack, YStack, useTheme } from 'tamagui'

import { duracionEntre, fechaNatural } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import { finDeLaAtencion, type Atencion } from './api'
import { RutaDelTraslado } from './RutaDelTraslado'
import { TEXTO_ESTADO, TONO_ESTADO } from './textos'

/**
 * Un traslado ya hecho, en la lista. De un viaje pasado lo primero que se mira es de dónde a dónde fue y cuánto
 * duró: eso manda sobre el resto. Lo que se salió de lo normal se ve sin entrar, para no tener que abrir uno por
 * uno buscando cuál fue.
 */
export function TarjetaDeTraslado({ atencion }: { atencion: Atencion }) {
  const tema = useTheme()
  const traslado = atencion.traslado
  const fin = finDeLaAtencion(atencion)

  return (
    <YStack
      gap={12}
      p={14}
      rounded={14}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
      pressStyle={{ bg: '$fondo' }}
      onPress={() =>
        router.push({ pathname: '/traslado/[atencionId]', params: { atencionId: String(atencion.id) } })
      }
    >
      <YStack gap={4}>
        <XStack items="center" justify="space-between" gap={8}>
          <Text fontSize={17} lineHeight={22} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
            {traslado?.pasajero ?? atencion.nombrePaciente ?? 'Sin nombre'}
          </Text>
          <Insignia tono={TONO_ESTADO[atencion.estado]}>{TEXTO_ESTADO[atencion.estado]}</Insignia>
        </XStack>
        <Text fontSize={13} color="$textoSecundario">
          {fechaNatural(atencion.horaToma)} · {atencion.placa}
        </Text>
      </YStack>

      {traslado ? (
        <RutaDelTraslado
          origen={traslado.origenReferencia ?? 'Origen marcado en el mapa'}
          destino={traslado.centroSaludDestino ?? 'Destino marcado en el mapa'}
        />
      ) : null}

      {/* Lo raro se ve sin abrir: es lo que se busca cuando alguien pregunta por un viaje en particular. */}
      {atencion.horaAvisoNoListo ? (
        <XStack items="center" gap={7}>
          <Feather name="alert-triangle" size={14} color={tema.enAtencionTexto?.val} />
          <Text fontSize={13} color="$enAtencionTexto" flex={1} numberOfLines={1}>
            El paciente no estaba listo
          </Text>
        </XStack>
      ) : null}

      <XStack items="center" justify="space-between" gap={8}>
        <Text fontSize={13} color="$textoSecundario" flex={1} numberOfLines={1}>
          {fin ? `Duró ${duracionEntre(atencion.horaToma, fin)}` : 'Sin terminar'}
        </Text>
        <Feather name="chevron-right" size={20} color={tema.textoTenue?.val} />
      </XStack>
    </YStack>
  )
}
