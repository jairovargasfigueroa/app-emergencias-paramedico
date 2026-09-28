import { Text, XStack, YStack } from 'tamagui'

import { textoOtrasUnidades } from '@/features/incidentes/cercania'
import type { Distancia } from '@/shared/formato/distancia'
import { duracionDesde, horaCorta } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import type { Atencion } from './api'

type Props = {
  atencion: Atencion
  /** Dirección del lugar al que va: es lo que el paramédico le lee al conductor, que no tiene la app. */
  lugar: string
  /** En un traslado, lo que ayuda a encontrar el lugar: la referencia del origen o el área del destino. */
  referencia: string | null
  distancia: Distancia | null
  unidadesAcudiendo: number
  ahora: number
}

/**
 * Tarjeta superior de la atención en curso. En camino manda la dirección; después, desde cuándo va cada hito. En un
 * traslado se va dos veces a un lugar conocido: al origen a buscar al paciente y, con él a bordo, al destino.
 */
export function TarjetaDeAtencion({ atencion, lugar, referencia, distancia, unidadesAcudiendo, ahora }: Props) {
  const esTraslado = atencion.traslado !== null
  const enElLugar = atencion.estado === 'EN_EL_LUGAR'
  const deCamino = atencion.estado === 'EN_CAMINO' || (esTraslado && atencion.estado === 'PACIENTE_RECOGIDO')

  // Un switch y no una cadena de ternarios: así agregar un estado obliga a decidir qué dice la tarjeta.
  const { encabezado, titulo } = ((): { encabezado: string; titulo: string } => {
    switch (atencion.estado) {
      case 'EN_CAMINO':
        return { encabezado: esTraslado ? 'Vas al origen' : 'Vas a', titulo: lugar }
      case 'EN_EL_LUGAR':
        return {
          encabezado: `${esTraslado ? 'Traslado' : 'Atención'} en curso · ${atencion.placa}`,
          titulo: `${esTraslado ? 'En el origen' : 'En el lugar'} desde las ${horaCorta(atencion.horaLlegada ?? atencion.horaToma)}`,
        }
      case 'PACIENTE_RECOGIDO':
        return {
          encabezado: `Paciente a bordo desde las ${horaCorta(atencion.horaRecogida ?? atencion.horaToma)} · ${atencion.placa}`,
          // En un traslado el destino se conoce desde antes de salir: se dice cuál es.
          titulo: esTraslado ? lugar : 'En traslado',
        }
      case 'EN_HOSPITAL':
        return {
          encabezado: `Llegaste a las ${horaCorta(atencion.horaLlegadaHospital ?? atencion.horaToma)} · ${atencion.placa}`,
          titulo: 'En el destino',
        }
      case 'SIN_TRASLADO':
        return { encabezado: `Atención terminada · ${atencion.placa}`, titulo: 'Sin traslado' }
      default:
        // Entregado y cancelada: la atención terminó pero la unidad sigue tomada hasta liberarse.
        return { encabezado: `Atención terminada · ${atencion.placa}`, titulo: 'Paciente entregado' }
    }
  })()

  // Debajo del lugar, mientras se va hacia él: cuánto falta y, en una emergencia, quién más va; en un traslado, lo que
  // ayuda a dar con la puerta.
  const aDistancia = distancia ? `a ${distancia.valor} ${distancia.unidad}` : null
  const detalle = esTraslado
    ? [aDistancia, referencia].filter(Boolean).join(' · ')
    : [aDistancia, textoOtrasUnidades(unidadesAcudiendo)].filter(Boolean).join(' · ')

  return (
    <XStack
      items="center"
      justify="space-between"
      gap={12}
      px={14}
      py={12}
      rounded={16}
      bg="$superficie"
      shadowColor="#000000"
      shadowOpacity={0.12}
      shadowRadius={24}
      shadowOffset={{ width: 0, height: 8 }}
      elevation={6}
    >
      <YStack gap={3} flex={1} minW={0}>
        <Text color="$textoSecundario" fontSize={14} numberOfLines={1}>
          {encabezado}
        </Text>
        <Text color="$texto" fontSize={deCamino ? 21 : 18} lineHeight={deCamino ? 26 : 24} fontWeight="600" numberOfLines={2}>
          {titulo}
        </Text>
        {deCamino && detalle ? (
          <Text color="$textoSecundario" fontSize={14} numberOfLines={1}>
            {detalle}
          </Text>
        ) : null}
      </YStack>

      {enElLugar ? <Insignia tono="verde">Llegaste</Insignia> : null}
      {atencion.estado === 'PACIENTE_RECOGIDO' ? (
        <Insignia tono="ambar">{duracionDesde(atencion.horaRecogida ?? atencion.horaToma, ahora)}</Insignia>
      ) : null}
      {atencion.estado === 'EN_HOSPITAL' ? (
        <Insignia tono="ambar">{duracionDesde(atencion.horaLlegadaHospital ?? atencion.horaToma, ahora)}</Insignia>
      ) : null}
      {/* La unidad sigue tomada mientras no se libere: el aviso tiene que decirlo. */}
      {atencion.horaLiberacion === null &&
      (atencion.estado === 'PACIENTE_ENTREGADO' || atencion.estado === 'SIN_TRASLADO') ? (
        <Insignia tono="ambar">Sin liberar</Insignia>
      ) : null}
    </XStack>
  )
}
