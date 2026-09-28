import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { tituloDelLugar } from '@/features/incidentes/direcciones'
import { useIncidentesAbiertos } from '@/features/incidentes/incidentesAbiertos'
import { MarcadorIncidente } from '@/features/incidentes/MarcadorIncidente'
import { direccionIncidenteQuery } from '@/features/incidentes/queries'
import { leerPosicionActual, usePosicionActual } from '@/features/posicion/posicionActual'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import { distanciaEnMetros, formatearDistancia } from '@/shared/formato/distancia'
import { CENTRO_POR_DEFECTO, DELTA_BARRIO, DELTA_CIUDAD, regionAlrededorDe } from '@/shared/mapa/region'
import { useAhora } from '@/shared/reloj/useAhora'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MantenerPresionado } from '@/shared/ui/MantenerPresionado'

import {
  incidenteDeLaAtencion,
  lugarDelTraslado,
  puntoDelTraslado,
  type Atencion,
  type Movilidad,
  type MotivoCancelacionPropio,
  type MotivoSinTraslado,
} from './api'
import { DialogoCancelar } from './DialogoCancelar'
import { DialogoDevolverTraslado } from './DialogoDevolverTraslado'
import { DialogoUnidadNoCorresponde } from './DialogoUnidadNoCorresponde'
import { EsperaDelPaciente } from './EsperaDelPaciente'
import { MarcadorDeTraslado } from './MarcadorDeTraslado'
import { PanelDeTraslado } from './PanelDeTraslado'
import { DialogoSinTraslado } from './DialogoSinTraslado'
import { HitosAtencion } from './HitosAtencion'
import { MenuAtencion } from './MenuAtencion'
import { TarjetaDeAtencion } from './TarjetaDeAtencion'
import {
  cancelarAtencionMutation,
  cerrarSinTrasladoMutation,
  direccionDelPuntoQuery,
  liberarMutation,
  marcarLlegadaAlHospitalMutation,
  marcarLlegadaMutation,
  marcarPacienteNoListoMutation,
  marcarRecogidaMutation,
  reconsultarTrasConflicto,
  unidadNoCorrespondeMutation,
} from './queries'

type Props = {
  paramedicoId: number
  atencion: Atencion
}

const MENSAJES_CANCELACION: Record<MotivoCancelacionPropio, string> = {
  AVERIA: 'Tu ambulancia quedó fuera de servicio.',
  NO_SE_ENCONTRO_PACIENTE: 'Tu ambulancia vuelve a estar disponible.',
  DESVIADA: 'Tu ambulancia vuelve a estar disponible.',
  RECHAZADA_POR_PARAMEDICO: 'El traslado vuelve a la cola y se le busca otra unidad.',
  OTRO: 'Tu ambulancia vuelve a estar disponible.',
}

/** Hasta qué parte del alto de la pantalla crecen los detalles abiertos; lo que no entra se desplaza. */
const FRACCION_DETALLES = 0.4

/**
 * A partir de esta distancia al incidente, o al origen de un traslado, se recuerda cuánto falta antes de marcar la
 * llegada: el hito congela la ubicación (PB-05 R2) y no se deshace. Es solo un aviso, nunca impide marcarla.
 */
const METROS_PARA_AVISAR_LA_DISTANCIA = 200

/**
 * PB-05: la atención en curso. Cada hito congela la hora y la ubicación del momento (R2) y no se deshace, así que se
 * confirma manteniendo presionado. Lo reversible se sigue tocando.
 */
export function AtencionEnCurso({ paramedicoId, atencion }: Props) {
  const margenes = useSafeAreaInsets()
  const { height: altoPantalla } = useWindowDimensions()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const posicion = usePosicionActual()
  const ahora = useAhora()
  const { incidentes } = useIncidentesAbiertos()
  const [detallesAbiertos, setDetallesAbiertos] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [devolviendo, setDevolviendo] = useState(false)
  const [cerrandoSinTraslado, setCerrandoSinTraslado] = useState(false)
  // El motivo con que se abre el cierre sin traslado cuando lo abre un botón que ya lo dice, como retirarse tras la espera.
  const [motivoSugerido, setMotivoSugerido] = useState<MotivoSinTraslado | null>(null)
  const [corrigiendoUnidad, setCorrigiendoUnidad] = useState(false)

  const llegada = useMutation(marcarLlegadaMutation(queryClient))
  const recogida = useMutation(marcarRecogidaMutation(queryClient))
  const llegadaAlHospital = useMutation(marcarLlegadaAlHospitalMutation(queryClient))
  const sinTraslado = useMutation(cerrarSinTrasladoMutation(queryClient))
  const liberacion = useMutation(liberarMutation(queryClient))
  const cancelacion = useMutation(cancelarAtencionMutation(queryClient))
  const noListo = useMutation(marcarPacienteNoListoMutation(queryClient))
  const unidadNoCorresponde = useMutation(unidadNoCorrespondeMutation(queryClient))

  // Firebase trae el incidente al día mientras está abierto, pero lo retira al cerrarse: entre la entrega y la
  // liberación ya no está ahí. Mientras tanto se usan los datos que llegaron con la atención.
  const enVivo = incidentes.find((abierto) => abierto.id === atencion.incidenteId)
  const incidente = enVivo ?? incidenteDeLaAtencion(atencion)
  const direccionIncidente = useQuery({
    ...direccionIncidenteQuery(incidente ?? { id: atencion.incidenteId ?? 0, latitud: 0, longitud: 0 }),
    enabled: incidente !== undefined,
  }).data
  // En un traslado no hay incidente: se va al origen hasta subir al paciente y al destino desde ahí. Un destino que es
  // un centro de salud ya tiene nombre, así que no hace falta buscarle la dirección.
  const punto = puntoDelTraslado(atencion)
  const conNombre = punto?.tipo === 'destino' && atencion.traslado?.centroSaludDestino != null
  const direccionDelPunto = useQuery({
    ...direccionDelPuntoQuery(punto?.ubicacion ?? { latitud: 0, longitud: 0 }),
    enabled: punto !== null && !conNombre,
  }).data
  const haciaDonde = incidente ?? punto?.ubicacion
  const metrosAlLugar = posicion && haciaDonde ? distanciaEnMetros(posicion, haciaDonde) : null
  const distancia = metrosAlLugar === null ? null : formatearDistancia(metrosAlLugar)
  const delTraslado = atencion.traslado && punto ? lugarDelTraslado(atencion.traslado, punto.tipo, direccionDelPunto) : null
  const lugar = punto
    ? tituloDelLugar(delTraslado?.nombre, distancia, punto.tipo === 'origen' ? 'Origen del traslado' : 'Destino del traslado')
    : tituloDelLugar(direccionIncidente, distancia)
  const avisoDeDistancia =
    metrosAlLugar !== null && metrosAlLugar > METROS_PARA_AVISAR_LA_DISTANCIA
      ? textoDeDistancia(metrosAlLugar, punto ? punto.tipo : 'lugar')
      : null

  const mapa = useRef<MapView>(null)
  const [regionInicial] = useState(() => {
    const inicio = incidente ?? punto?.ubicacion ?? leerPosicionActual()
    return regionAlrededorDe(inicio ?? CENTRO_POR_DEFECTO, inicio ? DELTA_BARRIO : DELTA_CIUDAD)
  })

  // Al subir al paciente el marcador pasa del origen al destino, que puede quedar fuera de la vista: se lleva la
  // cámara hasta allá.
  const tipoDePunto = punto?.tipo
  const ubicacionDelPunto = punto?.ubicacion
  const tipoMostrado = useRef(tipoDePunto)
  useEffect(() => {
    if (!ubicacionDelPunto || tipoDePunto === tipoMostrado.current) {
      return
    }
    tipoMostrado.current = tipoDePunto
    mapa.current?.animateToRegion(regionAlrededorDe(ubicacionDelPunto, DELTA_BARRIO), 600)
  }, [tipoDePunto, ubicacionDelPunto])

  function avisarError(titulo: string, error: unknown) {
    if (!(error instanceof ErrorApi && error.status === 409)) {
      toast.show(titulo, { message: mensajeDeError(error) })
      return
    }
    // La atención cambió en otro lado (transición inválida o ya finalizada): se vuelve a consultar. Si era un traslado
    // y se lo sacaron a la unidad, su aviso dice qué pasó y el error de la acción sobra.
    void reconsultarTrasConflicto(queryClient, paramedicoId, atencion).then((retirado) => {
      if (!retirado) {
        toast.show(titulo, { message: mensajeDeError(error) })
      }
    })
  }

  /** Si la petición falla, se vuelve a lanzar para que el control se desbloquee y pueda reintentarse. */
  function alFallar(titulo: string) {
    return (error: unknown) => {
      avisarError(titulo, error)
      throw error
    }
  }

  function marcarLlegada() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    return llegada
      .mutateAsync({ paramedicoId, atencionId: atencion.id, ubicacion })
      .catch(alFallar('No se pudo marcar la llegada'))
  }

  /** PB-05 CA-02: la recogida solo necesita la ubicación. Los datos del paciente son opcionales y van aparte (R3). */
  function marcarRecogida() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    return recogida
      .mutateAsync({ paramedicoId, atencionId: atencion.id, datos: ubicacion })
      .catch(alFallar('No se pudo marcar la recogida'))
  }

  function marcarLlegadaAlHospital() {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    return llegadaAlHospital
      .mutateAsync({ paramedicoId, atencionId: atencion.id, ubicacion })
      .catch(alFallar('No se pudo marcar la llegada al destino'))
  }

  /** La unidad recien queda libre aca, no al entregar: hasta entonces sigue ocupada en el hospital. */
  function liberar() {
    return liberacion
      .mutateAsync({ paramedicoId, atencionId: atencion.id })
      .catch(alFallar('No se pudo liberar la unidad'))
  }

  /**
   * Deja la marca con su hora y el servidor arranca la espera. Hasta que se cumple, la unidad no se puede retirar
   * por eso; subir al paciente se puede siempre.
   */
  function avisarPacienteNoListo() {
    noListo.mutate(
      { paramedicoId, atencionId: atencion.id },
      { onError: (error) => avisarError('No se pudo avisar', error) },
    )
  }

  /** Cada vez que se abre, sin el aviso de la vez anterior. */
  function abrirUnidadNoCorresponde() {
    unidadNoCorresponde.reset()
    setCorrigiendoUnidad(true)
  }

  function devolverPorUnidad(datos: { movilidad: Movilidad; oxigeno: boolean; equipo: boolean }) {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    unidadNoCorresponde.mutate(
      { paramedicoId, atencionId: atencion.id, ...ubicacion, ...datos },
      {
        onSuccess: () => setCorrigiendoUnidad(false),
        onError: (error) => {
          // Con lo marcado esta misma unidad alcanza: el diálogo queda abierto y lo dice, para corregir o subirlo.
          if (esUnidadQueAlcanza(error)) {
            return
          }
          setCorrigiendoUnidad(false)
          avisarError('No se pudo devolver el traslado', error)
        },
      },
    )
  }

  function abrirCierreSinTraslado(motivo: MotivoSinTraslado | null) {
    setMotivoSugerido(motivo)
    setCerrandoSinTraslado(true)
  }

  function cerrarSinTraslado(motivo: MotivoSinTraslado) {
    const ubicacion = leerPosicionActual()
    if (!ubicacion) {
      return
    }
    sinTraslado.mutate(
      { paramedicoId, atencionId: atencion.id, datos: { ...ubicacion, motivo } },
      {
        onSuccess: () => setCerrandoSinTraslado(false),
        onError: (error) => {
          setCerrandoSinTraslado(false)
          avisarError('No se pudo terminar la atencion', error)
        },
      },
    )
  }

  function cancelar(motivo: MotivoCancelacionPropio) {
    cancelacion.mutate(
      { paramedicoId, atencionId: atencion.id, motivo },
      {
        onSuccess: () => {
          setCancelando(false)
          toast.show('Atención cancelada', { message: MENSAJES_CANCELACION[motivo] })
        },
        onError: (error) => {
          setCancelando(false)
          avisarError('No se pudo cancelar la atención', error)
        },
      },
    )
  }

  /** La tripulación no puede hacer el traslado que le asignaron: vuelve a la cola y se le busca otra unidad. */
  function devolver() {
    cancelacion.mutate(
      { paramedicoId, atencionId: atencion.id, motivo: 'RECHAZADA_POR_PARAMEDICO' },
      {
        onSuccess: () => {
          setDevolviendo(false)
          toast.show('Traslado devuelto', { message: MENSAJES_CANCELACION.RECHAZADA_POR_PARAMEDICO })
        },
        onError: (error) => {
          setDevolviendo(false)
          avisarError('No se pudo devolver el traslado', error)
        },
      },
    )
  }

  const sinPosicion = posicion === null
  // Entregada o terminada sin traslado ya no hay nada que cancelar (ME-1): solo queda liberar la unidad.
  const sePuedeCancelar = atencion.estado !== 'PACIENTE_ENTREGADO' && atencion.estado !== 'SIN_TRASLADO'
  const conPaciente = [atencion.nombrePaciente, atencion.documentoPaciente].filter(Boolean).join(' · ')
  const descripciones = incidente?.descripciones ?? []

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={regionInicial}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={esquema}
      >
        {incidente ? <MarcadorIncidente incidente={incidente} destacado /> : null}
        {punto ? <MarcadorDeTraslado key={punto.tipo} punto={punto} /> : null}
      </MapView>

      <YStack position="absolute" t={margenes.top + 12} l={16} r={16}>
        <TarjetaDeAtencion
          atencion={atencion}
          lugar={lugar}
          referencia={delTraslado?.referencia ?? null}
          distancia={distancia}
          unidadesAcudiendo={enVivo?.unidadesAcudiendo ?? 1}
          ahora={ahora}
        />
      </YStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        gap={12}
        px={16}
        pt={12}
        pb={margenes.bottom + 16}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
      >
        <YStack self="center" width={40} height={5} rounded={999} bg="$bordeFuerte" />

        {/* Retirar el pedido no corta el viaje: la decisión de seguir o volverse es de la unidad. */}
        {atencion.emisoresCancelaron && atencion.estado !== 'PACIENTE_ENTREGADO' && atencion.estado !== 'SIN_TRASLADO' ? (
          <XStack gap={10} px={14} py={12} rounded={14} borderWidth={1} borderColor="$enAtencion" bg="$enAtencionTinte">
            <Feather name="alert-triangle" size={20} color={tema.enAtencionTexto?.val} />
            <YStack flex={1} gap={2}>
              <Text color="$enAtencionTexto" fontSize={15} lineHeight={21} fontWeight="600">
                Quien avisó dice que ya no necesita la ambulancia
              </Text>
              <Paragraph color="$texto" fontSize={14} lineHeight={20}>
                Tú decides si sigues o te vuelves.
              </Paragraph>
            </YStack>
          </XStack>
        ) : null}

        {atencion.traslado ? <PanelDeTraslado traslado={atencion.traslado} /> : null}

        {atencion.estado === 'EN_CAMINO' ? (
          <>
            {avisoDeDistancia ? (
              <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
                {avisoDeDistancia}
              </Paragraph>
            ) : null}
            <MantenerPresionado
              texto={atencion.traslado ? 'Mantén presionado: llegué al origen' : 'Mantén presionado: llegué'}
              apagado={sinPosicion}
              textoApagado="Esperando tu ubicación para poder marcar la llegada"
              onCompletar={marcarLlegada}
            />
            {/* Devolver no es cancelar: la central asignó el traslado y la tripulación dice que no puede hacerlo. Va a
                la vista, como terminar sin trasladar, y solo mientras la unidad no llegó al origen. */}
            {atencion.traslado ? (
              <Button chromeless height={48} onPress={() => setDevolviendo(true)}>
                <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
                  Devolver el traslado
                </Button.Text>
              </Button>
            ) : null}
          </>
        ) : null}

        {atencion.estado === 'EN_EL_LUGAR' ? (
          <>
            <MantenerPresionado
              texto="Mantén presionado: paciente a bordo"
              apagado={sinPosicion}
              textoApagado="Esperando tu ubicación para poder marcar la recogida"
              onCompletar={marcarRecogida}
            />
            <Tarea
              texto={conPaciente || 'Datos del paciente · opcional'}
              accion={conPaciente ? 'Editar' : 'Agregar'}
              onPress={() => router.push('/atencion/paciente')}
            />
            {atencion.traslado ? (
              <>
                {/* Avisado que no estaba listo, el botón deja lugar a la espera en curso, que dice hasta cuándo. */}
                {atencion.horaAvisoNoListo === null ? (
                  <Button chromeless height={48} disabled={noListo.isPending} onPress={() => avisarPacienteNoListo()}>
                    <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
                      El paciente no está listo
                    </Button.Text>
                  </Button>
                ) : null}
                {atencion.esperaHasta ? (
                  <EsperaDelPaciente
                    esperaHasta={atencion.esperaHasta}
                    onRetirarse={() => abrirCierreSinTraslado('PACIENTE_NO_LISTO')}
                  />
                ) : null}
                <Button chromeless height={48} onPress={abrirUnidadNoCorresponde}>
                  <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
                    La unidad no corresponde
                  </Button.Text>
                </Button>
              </>
            ) : null}
            {/* No trasladar es un desenlace normal, no una cancelación: va a la vista, no escondido en el menú. */}
            <Button chromeless height={48} onPress={() => abrirCierreSinTraslado(null)}>
              <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
                Terminar sin trasladar
              </Button.Text>
            </Button>
          </>
        ) : null}

        {atencion.estado === 'PACIENTE_RECOGIDO' ? (
          <>
            <MantenerPresionado
              texto="Mantén presionado: llegué al destino"
              apagado={sinPosicion}
              textoApagado="Esperando tu ubicación para poder marcar la llegada"
              onCompletar={marcarLlegadaAlHospital}
            />
            <Tarea
              texto={conPaciente || 'Falta anotar al paciente'}
              destacada={!conPaciente}
              accion={conPaciente ? 'Editar' : 'Agregar'}
              onPress={() => router.push('/atencion/paciente')}
            />
          </>
        ) : null}

        {atencion.estado === 'EN_HOSPITAL' ? (
          <>
            <BotonPrincipal onPress={() => router.push('/atencion/entrega')}>
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                Entregar al paciente
              </Button.Text>
            </BotonPrincipal>
            <Tarea
              texto={conPaciente || 'Falta anotar al paciente'}
              destacada={!conPaciente}
              accion={conPaciente ? 'Editar' : 'Agregar'}
              onPress={() => router.push('/atencion/paciente')}
            />
          </>
        ) : null}

        {/* El caso terminó, pero la unidad sigue tomada hasta que se libera: entregar no es quedar libre. */}
        {atencion.estado === 'PACIENTE_ENTREGADO' || atencion.estado === 'SIN_TRASLADO' ? (
          <>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
              {atencion.estado === 'PACIENTE_ENTREGADO'
                ? 'Paciente entregado. Tu unidad sigue ocupada hasta que la liberes.'
                : 'Atención terminada. Tu unidad sigue ocupada hasta que la liberes.'}
            </Paragraph>
            <MantenerPresionado texto="Mantén presionado: ya estoy disponible" onCompletar={liberar} />
          </>
        ) : null}

        {/* Con varios reportes puede no entrar todo: se desplaza adentro y el paso siguiente sigue a la vista. */}
        {detallesAbiertos ? (
          <ScrollView
            style={{ maxHeight: altoPantalla * FRACCION_DETALLES }}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 4, paddingTop: 4 }}
          >
            {/* PB-03 R2: todas las descripciones, no solo la primera; pueden haber avisado varias personas. Un
                traslado no tiene reportes: lo que se sabe de él ya está en su panel. */}
            {atencion.traslado ? null : (
              <YStack gap={10}>
                <Text color="$texto" fontSize={14} fontWeight="600">
                  Lo que reportaron
                </Text>
                {descripciones.length === 0 ? (
                  <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
                    Todavía no dijeron qué pasó.
                  </Paragraph>
                ) : (
                  descripciones.map((descripcion, indice) => (
                    <Paragraph
                      key={indice}
                      color="$texto"
                      fontSize={15}
                      lineHeight={22}
                      px={14}
                      py={12}
                      rounded={12}
                      borderWidth={1}
                      borderColor="$borde"
                    >
                      {descripcion}
                    </Paragraph>
                  ))
                )}
              </YStack>
            )}
            <HitosAtencion atencion={atencion} />
          </ScrollView>
        ) : null}

        {/* 48 px como mínimo: se tocan con guantes y con el vehículo en movimiento. */}
        <XStack items="center" justify="space-between" gap={10}>
          <Button chromeless px={4} height={48} onPress={() => setDetallesAbiertos((abierto) => !abierto)}>
            <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
              {detallesAbiertos
                ? 'Ocultar detalles'
                : atencion.traslado
                  ? 'Ver detalles del traslado'
                  : 'Ver detalles del incidente'}
            </Button.Text>
          </Button>
          {/* Cancelar es lo único que trae el menú: si no se puede cancelar, no hay menú que abrir. */}
          {sePuedeCancelar ? (
            <Button
              width={48}
              height={48}
              p={0}
              rounded={12}
              bg="$superficie"
              borderColor="$borde"
              aria-label="Más opciones"
              onPress={() => setMenuAbierto(true)}
            >
              <Feather name="more-vertical" size={18} color={tema.textoSecundario?.val} />
            </Button>
          ) : null}
        </XStack>
      </YStack>

      <MenuAtencion
        abierto={menuAbierto}
        esTraslado={atencion.traslado !== null}
        onCancelarAtencion={() => {
          setMenuAbierto(false)
          setCancelando(true)
        }}
        onCerrar={() => setMenuAbierto(false)}
      />
      <DialogoSinTraslado
        abierto={cerrandoSinTraslado}
        esTraslado={atencion.traslado !== null}
        esperaHasta={atencion.esperaHasta}
        motivoInicial={motivoSugerido}
        enviando={sinTraslado.isPending}
        sinPosicion={sinPosicion}
        onConfirmar={cerrarSinTraslado}
        onCerrar={() => setCerrandoSinTraslado(false)}
      />
      {atencion.traslado ? (
        <DialogoUnidadNoCorresponde
          abierto={corrigiendoUnidad}
          ficha={atencion.traslado}
          aviso={esUnidadQueAlcanza(unidadNoCorresponde.error) ? mensajeDeError(unidadNoCorresponde.error) : null}
          enviando={unidadNoCorresponde.isPending}
          sinPosicion={sinPosicion}
          onConfirmar={devolverPorUnidad}
          onCerrar={() => setCorrigiendoUnidad(false)}
        />
      ) : null}
      <DialogoCancelar
        abierto={cancelando}
        estado={atencion.estado}
        esTraslado={atencion.traslado !== null}
        enviando={cancelacion.isPending}
        onConfirmar={cancelar}
        onCerrar={() => setCancelando(false)}
      />
      <DialogoDevolverTraslado
        abierto={devolviendo}
        enviando={cancelacion.isPending}
        onConfirmar={devolver}
        onCerrar={() => setDevolviendo(false)}
      />
    </YStack>
  )
}

/** El 409 de "la unidad no corresponde" cuando, con lo que se marcó, esta misma unidad alcanza para llevarlo. */
function esUnidadQueAlcanza(error: unknown) {
  return error instanceof ErrorApi && error.codigo === 'UNIDAD_ALCANZA'
}

/**
 * "Estás a 3,2 km del lugar", o "del origen" en un traslado: lo que falta para llegar, dicho igual que en el resto de
 * la pantalla.
 */
function textoDeDistancia(metros: number, adonde: 'lugar' | 'origen' | 'destino') {
  const { valor, unidad } = formatearDistancia(metros)
  return `Estás a ${valor} ${unidad} del ${adonde}`
}

/**
 * Fila discreta con algo pendiente y opcional, sin robarle sitio al paso siguiente. El botón ocupa todo el alto de la
 * fila: 48 px para tocarlo con guantes sin que la fila crezca.
 */
function Tarea({
  texto,
  accion,
  destacada = false,
  onPress,
}: {
  texto: string
  accion: string
  destacada?: boolean
  onPress: () => void
}) {
  return (
    <XStack items="center" justify="space-between" gap={10} pl={12} rounded={12} bg="$fondo" borderWidth={1} borderColor="$borde">
      <Text color={destacada ? '$texto' : '$textoSecundario'} fontSize={15} fontWeight={destacada ? '600' : '400'} numberOfLines={1} flex={1}>
        {texto}
      </Text>
      <Button chromeless height={48} px={19} rounded={12} onPress={onPress}>
        <Button.Text color="$primarioPresionado" fontSize={15} fontWeight="600">
          {accion}
        </Button.Text>
      </Button>
    </XStack>
  )
}
