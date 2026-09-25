import { Linking } from 'react-native'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'

import type { Movilidad, TrasladoDeAtencion } from './api'

const TEXTO_MOVILIDAD: Record<Movilidad, string> = {
  CAMINA_CON_AYUDA: 'Camina con ayuda',
  SILLA_DE_RUEDAS: 'Silla de ruedas',
  CAMILLA: 'Camilla',
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

  return (
    <YStack gap={10} p={14} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
      <XStack items="center" justify="space-between" gap={8}>
        <Text fontSize={16} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
          {traslado.pasajero}
        </Text>
        {traslado.horaCita ? (
          <Text fontSize={13} fontFamily="$mono" color="$textoSecundario">
            {new Date(traslado.horaCita).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
      </XStack>

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
