import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Button } from 'tamagui'

import { AtencionEnCurso } from '@/features/atencion/AtencionEnCurso'
import { atencionActivaQuery } from '@/features/atencion/queries'
import { MapaDeIncidentes } from '@/features/incidentes/MapaDeIncidentes'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import { olvidarParamedico, paramedicoGuardadoQuery, servicioActualQuery } from './queries'

/**
 * Pantalla principal: según el servicio del paramédico, su atención en curso, el mapa de incidentes o por qué no
 * puede operar.
 */
export function PantallaInicio() {
  const queryClient = useQueryClient()
  const paramedico = useQuery(paramedicoGuardadoQuery()).data
  const servicio = useQuery({ ...servicioActualQuery(paramedico?.id ?? 0), enabled: paramedico != null })
  const enServicio = servicio.data?.enServicio === true
  const atencion = useQuery({ ...atencionActivaQuery(paramedico?.id ?? 0), enabled: paramedico != null && enServicio })
  const noReconocido = servicio.error instanceof ErrorApi && servicio.error.status === 404

  useEffect(() => {
    // El backend ya no tiene un paramédico activo con ese id: se vuelve a pedir la identificación.
    if (noReconocido) {
      void olvidarParamedico(queryClient)
    }
  }, [noReconocido, queryClient])

  if (servicio.isPending || noReconocido) {
    return <PantallaDeEstado cargando />
  }

  if (servicio.isError) {
    return (
      <PantallaDeEstado titulo="No pudimos cargar tu servicio" descripcion={mensajeDeError(servicio.error)}>
        <BotonPrincipal onPress={() => servicio.refetch()}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Reintentar
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  const { ambulancia, paramedico: datosParamedico } = servicio.data

  if (!enServicio || !ambulancia) {
    return (
      <PantallaDeEstado
        titulo="Sin ambulancia asignada"
        descripcion="Pide al administrador que te asigne una ambulancia activa para empezar el servicio."
      >
        <BotonPrincipal disabled={servicio.isFetching} onPress={() => servicio.refetch()}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Actualizar
          </Button.Text>
        </BotonPrincipal>
        <Button height={48} rounded={14} chromeless onPress={() => olvidarParamedico(queryClient)}>
          <Button.Text color="$texto" fontSize={15} fontWeight="500">
            {`No soy ${datosParamedico.nombreCompleto}`}
          </Button.Text>
        </Button>
      </PantallaDeEstado>
    )
  }

  if (atencion.isPending) {
    return <PantallaDeEstado cargando />
  }

  if (atencion.isError) {
    return (
      <PantallaDeEstado titulo="No pudimos cargar tu atención" descripcion={mensajeDeError(atencion.error)}>
        <BotonPrincipal onPress={() => atencion.refetch()}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Reintentar
          </Button.Text>
        </BotonPrincipal>
      </PantallaDeEstado>
    )
  }

  if (atencion.data) {
    return <AtencionEnCurso paramedicoId={datosParamedico.id} atencion={atencion.data} ambulancia={ambulancia} />
  }

  return <MapaDeIncidentes ambulancia={ambulancia} nombreParamedico={datosParamedico.nombreCompleto} />
}
