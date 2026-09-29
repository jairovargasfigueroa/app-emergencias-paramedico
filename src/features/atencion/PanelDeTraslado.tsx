import { Linking } from 'react-native'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'

import { horaCorta } from '@/shared/formato/tiempo'

import type { TrasladoDeAtencion } from './api'
import { TEXTO_MOVILIDAD, TEXTO_TIPO_UNIDAD } from './textos'

/**
 * Para cuándo es y cuándo hay que pasar a buscarlo: "Cita 10:00 · Recoger entre 09:10 y 09:30". La ventana es lo que
 * se le prometió a la familia; si cae en un mismo minuto, va una sola hora.
 */
function horasDelTraslado(traslado: TrasladoDeAtencion) {
  const cuando =
    traslado.modoHorario === 'INMEDIATO' ? 'Para ahora' : traslado.horaCita ? `Cita ${horaCorta(traslado.horaCita)}` : null
  const desde = traslado.horaRecogidaDesde ? horaCorta(traslado.horaRecogidaDesde) : null
  const hasta = traslado.horaRecogidaHasta ? horaCorta(traslado.horaRecogidaHasta) : null
  const recoger = desde && hasta ? (desde === hasta ? `Recoger a las ${desde}` : `Recoger entre ${desde} y ${hasta}`) : null
  return [cuando, recoger].filter(Boolean).join(' · ')
}

/**
 * Lo que distingue a un traslado de una emergencia: se sabe todo antes de salir. A quién recoger, qué necesita,
 * a dónde va y a qué hora tiene que estar. Va arriba de los hitos porque es lo que hay que leer primero.
 */
export function PanelDeTraslado({ traslado }: { traslado: TrasladoDeAtencion }) {
  const necesita = [
    traslado.oxigeno ? 'oxígeno' : null,
    traslado.equipo ? 'vía o sonda' : null,
    traslado.aislamiento ? 'aislamiento' : null,
  ].filter((texto): texto is string => texto !== null)
  const horas = horasDelTraslado(traslado)

  return (
    <YStack gap={10} p={14} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
      <XStack items="center" justify="space-between" gap={8}>
        <Text fontSize={16} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
          {traslado.pasajero}
        </Text>
        {/* La unidad que hace falta: si no es la que se tiene, se ve antes de salir. */}
        <Text fontSize={13} fontFamily="$mono" color="$textoSecundario">
          {TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]}
        </Text>
      </XStack>

      {horas ? (
        <Text fontSize={14} fontWeight="500" color="$texto">
          {horas}
        </Text>
      ) : null}

      <Text fontSize={14} color="$texto">
        {TEXTO_MOVILIDAD[traslado.movilidad]}
        {necesita.length > 0 ? ` · ${necesita.join(' · ')}` : ''}
        {traslado.pesoAproximado ? ` · ${traslado.pesoAproximado} kg` : ''}
      </Text>

      {traslado.origenReferencia ? (
        <Dato etiqueta="Referencia" valor={traslado.origenReferencia} />
      ) : null}

      <Dato
        etiqueta="Destino"
        valor={`${traslado.centroSaludDestino ?? 'Punto marcado en el mapa'}${traslado.destinoDetalle ? ` · ${traslado.destinoDetalle}` : ''}`}
      />

      {traslado.acompanantes > 0 ? (
        <Dato etiqueta="Acompañantes" valor={String(traslado.acompanantes)} />
      ) : null}

      {traslado.observaciones ? (
        <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
          {traslado.observaciones}
        </Paragraph>
      ) : null}

      {traslado.contactoNombre && traslado.contactoTelefono ? (
        <Button
          height={44}
          rounded={12}
          variant="outlined"
          onPress={() => void Linking.openURL(`tel:${traslado.contactoTelefono}`)}
        >
          <Button.Text color="$texto" fontSize={14} fontWeight="600">
            Llamar a {traslado.contactoNombre}
          </Button.Text>
        </Button>
      ) : null}
    </YStack>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <XStack gap={10} items="flex-start">
      <Text fontSize={13} color="$textoSecundario" width={92}>
        {etiqueta}
      </Text>
      <Text fontSize={14} color="$texto" flex={1}>
        {valor}
      </Text>
    </XStack>
  )
}
