import { useQuery } from '@tanstack/react-query'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

import { Insignia } from '@/shared/ui/Insignia'

import type { Atencion, EstadoAtencion } from './api'
import { misTrasladosQuery } from './queries'

const TEXTO_ESTADO: Record<EstadoAtencion, string> = {
  EN_CAMINO: 'En camino',
  EN_EL_LUGAR: 'En el lugar',
  PACIENTE_RECOGIDO: 'Paciente a bordo',
  EN_HOSPITAL: 'En el destino',
  PACIENTE_ENTREGADO: 'Entregado',
  SIN_TRASLADO: 'Sin traslado',
  CANCELADA: 'Cancelada',
}

const TONO: Record<EstadoAtencion, 'verde' | 'ambar' | 'gris'> = {
  EN_CAMINO: 'ambar',
  EN_EL_LUGAR: 'ambar',
  PACIENTE_RECOGIDO: 'ambar',
  EN_HOSPITAL: 'ambar',
  PACIENTE_ENTREGADO: 'verde',
  SIN_TRASLADO: 'gris',
  CANCELADA: 'gris',
}

/** Los traslados que hizo este paramédico. Es para mirar: lo que está haciendo ahora vive en Inicio. */
export function PantallaMisTraslados() {
  const margenes = useSafeAreaInsets()
  const traslados = useQuery(misTrasladosQuery())

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
    >
      <YStack gap={18}>
        <YStack gap={4}>
          <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
            Mis traslados
          </H1>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Los que hiciste, del más reciente al más viejo.
          </Paragraph>
        </YStack>

        {traslados.isPending ? (
          <XStack items="center" gap={8} py={12}>
            <Spinner size="small" color="$textoSecundario" />
            <Text fontSize={14} color="$textoSecundario">
              Cargando…
            </Text>
          </XStack>
        ) : traslados.isError ? (
          <Text fontSize={14} color="$textoSecundario">
            No pudimos cargar tus traslados.
          </Text>
        ) : traslados.data.length === 0 ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Todavía no hiciste ningún traslado.
          </Paragraph>
        ) : (
          traslados.data.map((atencion) => <Tarjeta key={atencion.id} atencion={atencion} />)
        )}
      </YStack>
    </ScrollView>
  )
}

function Tarjeta({ atencion }: { atencion: Atencion }) {
  const traslado = atencion.traslado
  return (
    <YStack gap={6} p={14} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
      <XStack items="center" justify="space-between" gap={8}>
        <Text fontSize={16} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
          {traslado?.pasajero ?? atencion.nombrePaciente ?? 'Sin nombre'}
        </Text>
        <Insignia tono={TONO[atencion.estado]}>{TEXTO_ESTADO[atencion.estado]}</Insignia>
      </XStack>
      <Text fontSize={13} color="$textoSecundario">
        {fechaCorta(atencion.horaToma)} · {atencion.placa}
      </Text>
      {traslado ? (
        <Text fontSize={13} color="$textoSecundario" numberOfLines={1}>
          {traslado.origenReferencia ?? 'Origen en el mapa'} → {traslado.centroSaludDestino ?? 'Destino en el mapa'}
        </Text>
      ) : null}
      {atencion.horaAvisoNoListo ? (
        <Text fontSize={12} color="$textoSecundario">
          El paciente no estaba listo cuando llegaste.
        </Text>
      ) : null}
    </YStack>
  )
}

function fechaCorta(iso: string) {
  const fecha = new Date(iso)
  return `${fecha.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })} · ${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`
}
