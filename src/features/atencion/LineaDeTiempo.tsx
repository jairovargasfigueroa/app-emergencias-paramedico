import Feather from '@expo/vector-icons/Feather'
import { Text, XStack, YStack, useTheme } from 'tamagui'

import { duracionEntre, horaCorta } from '@/shared/formato/tiempo'

import type { Atencion } from './api'

type Paso = {
  clave: string
  titulo: string
  hora: string
  /** Se salió de lo esperado: espera de más, cancelación. Se marca en ámbar para que salte al recorrer la lista. */
  fueraDeLoNormal?: boolean
}

/**
 * Los hitos en el orden de ME-1. Un hito que no pasó no deja hora, así que la lista sale sola de lo que hay: una
 * salida cancelada en camino tiene dos pasos y un traslado completo, seis.
 */
function pasosDe(atencion: Atencion): Paso[] {
  const posibles: (Paso | null)[] = [
    // No se toma: lo asigna la central.
    { clave: 'toma', titulo: 'Te asignaron el traslado', hora: atencion.horaToma },
    conHora('llegada', 'Llegaste al origen', atencion.horaLlegada),
    conHora('no-listo', 'El paciente no estaba listo', atencion.horaAvisoNoListo, true),
    conHora('recogida', 'Paciente a bordo', atencion.horaRecogida),
    conHora('hospital', 'Llegaste al destino', atencion.horaLlegadaHospital),
    conHora('entrega', 'Paciente entregado', atencion.horaEntrega),
    conHora('sin-traslado', 'Terminó sin traslado', atencion.horaSinTraslado, true),
    conHora('cancelacion', 'Atención cancelada', atencion.horaCancelacion, true),
    conHora('liberacion', 'Unidad liberada', atencion.horaLiberacion),
  ]
  return posibles.filter((paso): paso is Paso => paso !== null)
}

function conHora(clave: string, titulo: string, hora: string | null, fueraDeLoNormal = false): Paso | null {
  return hora === null ? null : { clave, titulo, hora, fueraDeLoNormal }
}

/**
 * La línea de tiempo del viaje con lo que pasó entre hito e hito. De un traslado ya hecho, el dato que se busca
 * casi siempre es ese hueco: cuánto se esperó en la puerta, cuánto tomó el camino al hospital. Las horas sueltas
 * obligan a restar de cabeza.
 */
export function LineaDeTiempo({ atencion }: { atencion: Atencion }) {
  const tema = useTheme()
  const pasos = pasosDe(atencion)

  return (
    <YStack>
      {pasos.map((paso, indice) => {
        const siguiente = pasos[indice + 1]
        const ultimo = siguiente === undefined

        return (
          <XStack key={paso.clave} gap={14}>
            <YStack items="center">
              <YStack
                width={26}
                height={26}
                rounded={999}
                items="center"
                justify="center"
                bg={paso.fueraDeLoNormal ? '$enAtencionTinte' : '$disponibleTinte'}
              >
                <Feather
                  name={paso.fueraDeLoNormal ? 'alert-triangle' : 'check'}
                  size={14}
                  color={paso.fueraDeLoNormal ? tema.enAtencionTexto?.val : tema.disponibleTexto?.val}
                />
              </YStack>
              {ultimo ? null : <YStack width={2} flex={1} minH={20} bg="$borde" />}
            </YStack>

            <YStack flex={1} minW={0} pt={2} pb={ultimo ? 0 : 14} gap={2}>
              <XStack items="center" justify="space-between" gap={10}>
                <Text
                  color={paso.fueraDeLoNormal ? '$enAtencionTexto' : '$texto'}
                  fontSize={15}
                  lineHeight={20}
                  fontWeight="500"
                  flex={1}
                >
                  {paso.titulo}
                </Text>
                <Text color="$texto" fontFamily="$mono" fontSize={15}>
                  {horaCorta(paso.hora)}
                </Text>
              </XStack>
              {siguiente ? (
                <Text color="$textoTenue" fontSize={13}>
                  {`+ ${duracionEntre(paso.hora, siguiente.hora)}`}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        )
      })}
    </YStack>
  )
}
