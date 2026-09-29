import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { Linking, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { duracionEntre, fechaNatural } from '@/shared/formato/tiempo'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { Insignia } from '@/shared/ui/Insignia'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import { finDeLaAtencion, type Atencion, type TrasladoDeAtencion } from './api'
import { LineaDeTiempo } from './LineaDeTiempo'
import { misTrasladosQuery } from './queries'
import { RutaDelTraslado } from './RutaDelTraslado'
import {
  TEXTO_ESTADO,
  TEXTO_MOTIVO_CANCELACION,
  TEXTO_MOTIVO_SIN_TRASLADO,
  TEXTO_MOVILIDAD,
  TONO_ESTADO,
} from './textos'

function volver() {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

/**
 * Un traslado que este paramédico ya hizo. Sale de la misma consulta que alimenta la lista: el historial llega
 * completo en `misTraslados`, así que abrir uno no pide nada más al servidor ni espera.
 */
export function PantallaTrasladoHecho() {
  const { atencionId } = useLocalSearchParams<{ atencionId: string }>()
  const traslados = useQuery(misTrasladosQuery())
  const atencion = traslados.data?.find((item) => String(item.id) === atencionId)

  if (traslados.isPending) {
    return <PantallaDeEstado cargando />
  }

  if (!atencion) {
    return (
      <PantallaDeEstado
        titulo="No encontramos ese traslado"
        descripcion="Puede que ya no esté en tu historial. Vuelve a la lista y búscalo de nuevo."
      >
        <BotonPrincipal onPress={volver}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Volver
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  return <Detalle atencion={atencion} />
}

function Detalle({ atencion }: { atencion: Atencion }) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const traslado = atencion.traslado
  const fin = finDeLaAtencion(atencion)
  const observaciones = traslado?.observaciones ?? null

  return (
    <YStack flex={1} bg="$fondo" pt={margenes.top + 8}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: margenes.bottom + 28, gap: 18 }}>
        <XStack items="center" gap={12}>
          <Button
            width={48}
            height={48}
            p={0}
            rounded={999}
            bg="$superficie"
            borderColor="$borde"
            aria-label="Volver a mis traslados"
            onPress={volver}
          >
            <Feather name="chevron-left" size={24} color={tema.texto?.val} />
          </Button>
          <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600" flex={1} numberOfLines={2}>
            {traslado?.pasajero ?? atencion.nombrePaciente ?? 'Sin nombre'}
          </H1>
        </XStack>

        <YStack gap={8}>
          <XStack items="center" gap={10}>
            <Insignia tono={TONO_ESTADO[atencion.estado]}>{TEXTO_ESTADO[atencion.estado]}</Insignia>
            <Text fontSize={14} color="$textoSecundario" flex={1} numberOfLines={1}>
              {fechaNatural(atencion.horaToma)} · {atencion.placa}
            </Text>
          </XStack>
          {fin ? (
            <Text fontSize={20} lineHeight={26} fontWeight="600" color="$texto">
              {`Duró ${duracionEntre(atencion.horaToma, fin)}`}
            </Text>
          ) : null}
        </YStack>

        {/* Por qué no terminó como un traslado normal. Va arriba: explica la insignia que se acaba de leer. */}
        {atencion.estado === 'SIN_TRASLADO' && atencion.motivoSinTraslado ? (
          <Aviso texto={TEXTO_MOTIVO_SIN_TRASLADO[atencion.motivoSinTraslado]} titulo="No se trasladó" />
        ) : null}
        {atencion.estado === 'CANCELADA' && atencion.motivoCancelacion ? (
          <Aviso texto={TEXTO_MOTIVO_CANCELACION[atencion.motivoCancelacion]} titulo="Se canceló" />
        ) : null}
        {atencion.horaAvisoNoListo ? (
          <Aviso
            titulo="El paciente no estaba listo"
            texto="Llegaste y hubo que esperar. La espera quedó registrada en la línea de tiempo."
          />
        ) : null}

        {traslado ? <Recorrido traslado={traslado} /> : null}

        <Bloque titulo="Cómo fue">
          <LineaDeTiempo atencion={atencion} />
        </Bloque>

        {traslado ? (
          <Bloque titulo="Qué necesitaba">
            <YStack gap={10}>
              <Dato etiqueta="Cómo viajaba" valor={TEXTO_MOVILIDAD[traslado.movilidad]} />
              <Dato etiqueta="Necesitaba" valor={necesitaba(traslado)} />
              {traslado.pesoAproximado ? <Dato etiqueta="Peso" valor={`${traslado.pesoAproximado} kg`} /> : null}
              <Dato
                etiqueta="Acompañantes"
                valor={traslado.acompanantes > 0 ? String(traslado.acompanantes) : 'Ninguno'}
              />
            </YStack>
          </Bloque>
        ) : null}

        {observaciones ? (
          <Bloque titulo="Observaciones">
            <Paragraph color="$texto" fontSize={15} lineHeight={22}>
              {observaciones}
            </Paragraph>
          </Bloque>
        ) : null}
      </ScrollView>
    </YStack>
  )
}

/** De dónde a dónde fue, y con quién se coordinó en la puerta: el contacto solo sirve al lado de la dirección. */
function Recorrido({ traslado }: { traslado: TrasladoDeAtencion }) {
  return (
    <Bloque titulo="Recorrido">
      <YStack gap={14}>
        <RutaDelTraslado
          origen={traslado.origenReferencia ?? 'Origen marcado en el mapa'}
          destino={traslado.centroSaludDestino ?? 'Destino marcado en el mapa'}
          destinoDetalle={traslado.destinoDetalle}
        />
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
    </Bloque>
  )
}

function necesitaba(traslado: TrasladoDeAtencion) {
  const marcadas = [
    traslado.oxigeno ? 'oxígeno' : null,
    traslado.equipo ? 'vía o sonda' : null,
    traslado.aislamiento ? 'aislamiento' : null,
  ].filter((texto): texto is string => texto !== null)
  return marcadas.length === 0 ? 'Nada en particular' : marcadas.join(' · ')
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack gap={12}>
      <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.6}>
        {titulo.toUpperCase()}
      </Text>
      <YStack p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
        {children}
      </YStack>
    </YStack>
  )
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  const tema = useTheme()
  return (
    <XStack gap={12} px={14} py={12} rounded={14} borderWidth={1} borderColor="$enAtencion" bg="$enAtencionTinte">
      <Feather name="alert-triangle" size={20} color={tema.enAtencionTexto?.val} />
      <YStack flex={1} gap={2}>
        <Text color="$enAtencionTexto" fontSize={15} lineHeight={21} fontWeight="600">
          {titulo}
        </Text>
        <Paragraph color="$texto" fontSize={14} lineHeight={20}>
          {texto}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <XStack gap={12} items="flex-start">
      <Text fontSize={13} color="$textoSecundario" width={110}>
        {etiqueta}
      </Text>
      <Text fontSize={15} color="$texto" flex={1}>
        {valor}
      </Text>
    </XStack>
  )
}
