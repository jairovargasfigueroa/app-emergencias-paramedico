import { Text, XStack, YStack } from 'tamagui'

import { textoOtrasUnidades } from '@/features/incidentes/cercania'
import type { Distancia } from '@/shared/formato/distancia'
import { duracionDesde, horaCorta } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import type { Atencion } from './api'

type Props = {
  atencion: Atencion
  /** Dirección del incidente: es lo que el paramédico le lee al conductor, que no tiene la app. */
  lugar: string
  distancia: Distancia | null
  unidadesAcudiendo: number
  ahora: number
}

/** Tarjeta superior de la atención en curso. En camino manda la dirección; después, desde cuándo va cada hito. */
export function TarjetaDeAtencion({ atencion, lugar, distancia, unidadesAcudiendo, ahora }: Props) {
  const enCamino = atencion.estado === 'EN_CAMINO'
  const enElLugar = atencion.estado === 'EN_EL_LUGAR'

  const encabezado = enCamino
    ? 'Vas a'
    : enElLugar
      ? `Atención en curso · ${atencion.placa}`
      : `Paciente a bordo desde las ${horaCorta(atencion.horaRecogida ?? atencion.horaToma)} · ${atencion.placa}`

  const titulo = enCamino
    ? lugar
    : enElLugar
      ? `En el lugar desde las ${horaCorta(atencion.horaLlegada ?? atencion.horaToma)}`
      : 'En traslado'

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
        <Text color="$texto" fontSize={enCamino ? 21 : 18} lineHeight={enCamino ? 26 : 24} fontWeight="600" numberOfLines={2}>
          {titulo}
        </Text>
        {enCamino ? (
          <Text color="$textoSecundario" fontSize={14} numberOfLines={1}>
            {distancia
              ? `a ${distancia.valor} ${distancia.unidad} · ${textoOtrasUnidades(unidadesAcudiendo)}`
              : textoOtrasUnidades(unidadesAcudiendo)}
          </Text>
        ) : null}
      </YStack>

      {enElLugar ? <Insignia tono="verde">Llegaste</Insignia> : null}
      {atencion.estado === 'PACIENTE_RECOGIDO' ? (
        <Insignia tono="ambar">{duracionDesde(atencion.horaRecogida ?? atencion.horaToma, ahora)}</Insignia>
      ) : null}
    </XStack>
  )
}
