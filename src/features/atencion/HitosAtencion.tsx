import Feather from '@expo/vector-icons/Feather'
import { Text, XStack, YStack } from 'tamagui'

import { horaCorta } from '@/shared/formato/tiempo'

import type { Atencion, EstadoAtencion } from './api'

type Hito = {
  estado: EstadoAtencion
  titulo: string
  hora: (atencion: Atencion) => string | null
  textoHora: string
}

/** ME-1: los hitos van en este orden, sin saltos ni retrocesos (PB-05 R1). */
const HITOS_TRASLADO: Hito[] = [
  { estado: 'EN_CAMINO', titulo: 'En camino', hora: (a) => a.horaToma, textoHora: 'Tomado a las' },
  { estado: 'EN_EL_LUGAR', titulo: 'En el lugar', hora: (a) => a.horaLlegada, textoHora: 'Llegada a las' },
  { estado: 'PACIENTE_RECOGIDO', titulo: 'Paciente recogido', hora: (a) => a.horaRecogida, textoHora: 'Recogido a las' },
  { estado: 'EN_HOSPITAL', titulo: 'En el hospital', hora: (a) => a.horaLlegadaHospital, textoHora: 'Llegada a las' },
  { estado: 'PACIENTE_ENTREGADO', titulo: 'Paciente entregado', hora: (a) => a.horaEntrega, textoHora: 'Entregado a las' },
]

/** La salida que no traslada a nadie se corta en el lugar: nunca hubo paciente a bordo ni hospital. */
const HITOS_SIN_TRASLADO: Hito[] = [
  HITOS_TRASLADO[0],
  HITOS_TRASLADO[1],
  { estado: 'SIN_TRASLADO', titulo: 'Terminó sin traslado', hora: (a) => a.horaSinTraslado, textoHora: 'Cerrada a las' },
]

/**
 * Línea de tiempo de la atención: hitos cumplidos con su hora, el siguiente paso y los que faltan. Va plegada detrás
 * de "Ver detalles": mientras se conduce, el centro de la pantalla es para el hito que toca marcar.
 */
export function HitosAtencion({ atencion }: { atencion: Atencion }) {
  const hitos = atencion.estado === 'SIN_TRASLADO' ? HITOS_SIN_TRASLADO : HITOS_TRASLADO
  const actual = hitos.findIndex((hito) => hito.estado === atencion.estado)

  return (
    <YStack>
      {hitos.map((hito, indice) => {
        const cumplido = indice <= actual
        const siguiente = indice === actual + 1
        const ultimo = indice === hitos.length - 1
        const hora = hito.hora(atencion)

        return (
          <XStack key={hito.estado} gap={14}>
            <YStack items="center">
              {cumplido ? (
                <YStack width={28} height={28} rounded={999} bg="$disponible" items="center" justify="center">
                  <Feather name="check" size={16} color="#FFFFFF" />
                </YStack>
              ) : (
                <YStack
                  width={28}
                  height={28}
                  rounded={999}
                  borderWidth={siguiente ? 3 : 2}
                  borderColor={siguiente ? '$primario' : '$bordeFuerte'}
                  bg="$superficie"
                />
              )}
              {ultimo ? null : <YStack width={2} flex={1} minH={22} bg={indice < actual ? '$disponible' : '$borde'} />}
            </YStack>

            <YStack flex={1} pt={3} pb={ultimo ? 0 : 12} gap={2}>
              <Text
                color={cumplido || siguiente ? '$texto' : '$textoSecundario'}
                fontSize={15}
                fontWeight={cumplido || siguiente ? '600' : '400'}
              >
                {hito.titulo}
              </Text>
              {cumplido && hora ? (
                <Text color="$textoSecundario" fontSize={14}>
                  {`${hito.textoHora} ${horaCorta(hora)}`}
                </Text>
              ) : siguiente ? (
                <Text color="$primarioPresionado" fontSize={14}>
                  Siguiente paso
                </Text>
              ) : null}
            </YStack>
          </XStack>
        )
      })}
    </YStack>
  )
}
