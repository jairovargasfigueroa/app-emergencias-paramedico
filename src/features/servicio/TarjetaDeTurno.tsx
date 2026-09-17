import Feather from '@expo/vector-icons/Feather'
import { useState } from 'react'
import { Button, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { activarUbicacion, avisoDeUbicacion, useEstadoUbicacion } from '@/features/posicion/estadoUbicacion'

import type { Ambulancia } from './api'
import { AvisoFueraDeServicio } from './AvisoFueraDeServicio'
import { EstadoAmbulancia } from './EstadoAmbulancia'
import { HojaDeTurno } from './HojaDeTurno'

type Props = {
  ambulancia: Ambulancia
  nombreParamedico: string
}

/**
 * Tarjeta superior del mapa: es el acceso al turno. Si la ubicación no está llegando se pone en tono de aviso y lo
 * dice ahí mismo, con el acceso para activarla; antes fallaba en silencio.
 */
export function TarjetaDeTurno({ ambulancia, nombreParamedico }: Props) {
  const tema = useTheme()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const aviso = avisoDeUbicacion(useEstadoUbicacion())

  return (
    <YStack gap={10}>
      <XStack
        role="button"
        aria-label={`Tu turno, unidad ${ambulancia.placa}`}
        items="center"
        justify="space-between"
        gap={12}
        px={14}
        py={12}
        rounded={16}
        borderWidth={1}
        borderColor={aviso ? '$enAtencion' : '$borde'}
        bg={aviso ? '$enAtencionTinte' : '$superficie'}
        shadowColor="#000000"
        shadowOpacity={0.12}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={6}
        pressStyle={{ opacity: 0.8 }}
        onPress={() => setHojaAbierta(true)}
      >
        <YStack gap={2} flex={1} minW={0}>
          <Text color="$texto" fontFamily="$mono" fontSize={16} fontWeight="500">
            {ambulancia.placa}
          </Text>
          <Text color="$textoSecundario" fontSize={14} numberOfLines={1}>
            {`${nombreParamedico} · en servicio`}
          </Text>
          {aviso ? (
            <Paragraph color="$enAtencionTexto" fontSize={14} lineHeight={19} numberOfLines={2}>
              {aviso.texto}
            </Paragraph>
          ) : null}
        </YStack>

        {aviso?.conAccion ? (
          <Button
            size="$3"
            height={48}
            rounded={10}
            bg="$primario"
            borderWidth={0}
            pressStyle={{ bg: '$primarioPresionado' }}
            onPress={activarUbicacion}
          >
            <Button.Text color="$primarioTexto" fontSize={14} fontWeight="600">
              Activar
            </Button.Text>
          </Button>
        ) : (
          <XStack items="center" gap={4}>
            <EstadoAmbulancia estado={ambulancia.estado} />
            <Feather name="chevron-right" size={18} color={tema.textoTenue?.val} />
          </XStack>
        )}
      </XStack>

      {ambulancia.estado === 'FUERA_DE_SERVICIO' ? <AvisoFueraDeServicio ambulanciaId={ambulancia.id} /> : null}

      <HojaDeTurno abierta={hojaAbierta} placa={ambulancia.placa} onCerrar={() => setHojaAbierta(false)} />
    </YStack>
  )
}
