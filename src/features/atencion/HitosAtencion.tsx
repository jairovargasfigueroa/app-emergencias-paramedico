import Feather from '@expo/vector-icons/Feather'
import { Button, Text, XStack, YStack } from 'tamagui'

import { horaCorta } from '@/shared/formato/tiempo'

import type { Atencion, EstadoAtencion } from './api'

type Hito = {
  estado: EstadoAtencion
  titulo: string
  hora: (atencion: Atencion) => string | null
  textoHora: string
}

/** ME-1: los hitos van en este orden, sin saltos ni retrocesos (PB-05 R1). */
const HITOS: Hito[] = [
  { estado: 'EN_CAMINO', titulo: 'En camino', hora: (a) => a.horaToma, textoHora: 'Tomado a las' },
  { estado: 'EN_EL_LUGAR', titulo: 'En el lugar', hora: (a) => a.horaLlegada, textoHora: 'Llegada a las' },
  { estado: 'PACIENTE_RECOGIDO', titulo: 'Paciente recogido', hora: (a) => a.horaRecogida, textoHora: 'Recogido a las' },
  { estado: 'PACIENTE_ENTREGADO', titulo: 'Paciente entregado', hora: (a) => a.horaEntrega, textoHora: 'Entregado a las' },
]

type Props = {
  atencion: Atencion
  onEditarPaciente: () => void
}

/** Línea de tiempo de la atención: hitos cumplidos con su hora, el siguiente paso y los que faltan. */
export function HitosAtencion({ atencion, onEditarPaciente }: Props) {
  const actual = HITOS.findIndex((hito) => hito.estado === atencion.estado)

  return (
    <YStack>
      {HITOS.map((hito, indice) => {
        const cumplido = indice <= actual
        const siguiente = indice === actual + 1
        const ultimo = indice === HITOS.length - 1
        const hora = hito.hora(atencion)
        const conPaciente = hito.estado === 'PACIENTE_RECOGIDO' && cumplido

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
              {ultimo ? null : <YStack width={2} flex={1} minH={26} bg={indice < actual ? '$disponible' : '$borde'} />}
            </YStack>

            <YStack flex={1} pt={3} pb={ultimo ? 0 : 12} gap={2}>
              <Text color={cumplido || siguiente ? '$texto' : '$textoSecundario'} fontSize={15} fontWeight={cumplido || siguiente ? '600' : '400'}>
                {hito.titulo}
              </Text>
              {cumplido && hora ? (
                <Text color="$textoSecundario" fontSize={13}>
                  {`${hito.textoHora} ${horaCorta(hora)}`}
                </Text>
              ) : siguiente ? (
                <Text color="$primarioPresionado" fontSize={13}>
                  Siguiente paso
                </Text>
              ) : null}
              {conPaciente ? (
                <XStack items="center" justify="space-between" gap={8}>
                  <Text color="$texto" fontSize={13} numberOfLines={1} flex={1}>
                    {[atencion.nombrePaciente, atencion.documentoPaciente].filter(Boolean).join(' · ') ||
                      'Paciente sin datos'}
                  </Text>
                  <Button size="$2" chromeless onPress={onEditarPaciente}>
                    <Button.Text color="$primarioPresionado" fontSize={13} fontWeight="500">
                      Editar
                    </Button.Text>
                  </Button>
                </XStack>
              ) : null}
            </YStack>
          </XStack>
        )
      })}
    </YStack>
  )
}
