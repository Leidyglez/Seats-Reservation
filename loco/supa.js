/**
 * Obtiene todos los eventos disponibles desde Supabase
 */
async function obtenerEventos() {
  try {
    const { data, error } = await client.from('eventos').select('*');
    if (error) throw error;

    const eventos = (data || []).map(evento => ({
      ...evento,
      id: evento.idevento
    }));

    return eventos || [];
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    mostrarToast('Error', 'No se pudieron cargar los eventos.', 'error');
    return [];
  }
}

async function obtenerEventoPorId(idevento) {
  try {
    const { data, error } = await client.from('eventos').select('*').eq('idevento', idevento).single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return null;
  }
}

async function crearEvento(evento) {
  try {
    const { data: existentes, error: errorExistentes } = await client
      .from('eventos')
      .select('*')
      .eq('nombre', evento.nombre)
      .eq('fecha', evento.fecha);

    if (errorExistentes) throw errorExistentes;
    if (existentes.length > 0) {
      mostrarToast('Evento duplicado', 'Ya existe un evento con el mismo nombre y fecha.', 'error');
      return null;
    }

    const { data, error } = await client.from('eventos').insert([evento]).select().single();
    if (error) throw error;

    mostrarToast('Éxito', 'Evento creado correctamente.');
    return data;
  } catch (error) {
    console.error('Error al crear evento:', error);
    mostrarToast('Error', 'No se pudo crear el evento.', 'error');
    return null;
  }
}

async function editarEvento(id, eventoActualizado) {
  try {
    // Verificar que el evento existe
    const { data: eventoExistente, error: errorVerificacion } = await client
      .from('eventos')
      .select('*')
      .eq('idevento', id)
      .single();

    if (errorVerificacion) throw errorVerificacion;
    if (!eventoExistente) {
      mostrarToast('Error', 'El evento no existe.', 'error');
      return null;
    }

    // Verificar duplicados solo si cambió el nombre o la fecha
    if (eventoActualizado.nombre !== eventoExistente.nombre || 
        eventoActualizado.fecha !== eventoExistente.fecha) {
      
      const { data: existentes, error: errorExistentes } = await client
        .from('eventos')
        .select('*')
        .eq('nombre', eventoActualizado.nombre)
        .eq('fecha', eventoActualizado.fecha)
        .neq('idevento', id); // Excluir el evento actual

      if (errorExistentes) throw errorExistentes;
      if (existentes.length > 0) {
        mostrarToast('Evento duplicado', 'Ya existe otro evento con el mismo nombre y fecha.', 'error');
        return null;
      }
    }

    // Actualizar el evento
    const { data, error } = await client
      .from('eventos')
      .update({
        idevento: eventoActualizado.idevento,
        nombre: eventoActualizado.nombre,
        fecha: eventoActualizado.fecha,
        descripcion: eventoActualizado.descripcion,
        hora: eventoActualizado.hora,
        estado: eventoActualizado.estado
      })
      .eq('idevento', id)
      .select()
      .single();

    if (error) throw error;

    mostrarToast('Éxito', 'Evento actualizado correctamente.');
    return data;
  } catch (error) {
    console.error('Error al editar evento:', error);
    mostrarToast('Error', 'No se pudo actualizar el evento.', 'error');
    return null;
  }
}

/**
 * Genera todos los asientos en memoria para un evento
 * @param {number} idevento 
 * @returns {Array} 
 */
function generarAsientosEnMemoria(idevento) {
  const filas = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
  const asientos = [];

  for (let seccion = 1; seccion <= 2; seccion++) {
    for (const fila of filas) {
      for (let columna = 1; columna <= 7; columna++) {
        columna = columna.toString()

        var nuevoAsiento = {
          idasientos: -1, // ID temporal para asientos en memoria
          seccion,
          fila,
          columna,
          estado: 'Disponible',
          idevento: idevento,
          asistente: '',
          comentario: ''
        };
        nuevoAsiento.identificador = obtenerIdentificadorAsiento(nuevoAsiento);

        asientos.push(nuevoAsiento);
      }
    }
  }

  return asientos;
}

function obtenerIdentificadorAsiento(asiento) {
  return `${asiento.seccion}-${asiento.fila}-${asiento.columna}`;
}

async function obtenerAsientosGenerales() {
  try {
    const { data, error } = await client.from('asientos').select('*').neq('estado', 'Disponible');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener asientos generales:', error);
    return [];
  }
}

/**
 * Obtiene los asientos para un evento específico
 * Genera todos los asientos en memoria y luego actualiza con los datos de la BD
 * @param {number} idevento
 * @returns {Array} Array completo de asientos
 */
async function obtenerAsientos(idevento) {
  try {
    
    const asientosMemoria = generarAsientosEnMemoria(idevento);
    
    // Obtener solo los asientos no disponibles de la BD
    const { data: asientosBD, error } = await client
      .from('asientos')
      .select('*')
      .eq('idevento', idevento)
      .neq('estado', 'Disponible');
    
    if (error) throw error;
    
    // Actualizar los asientos en memoria con los datos de la BD
    if (asientosBD && asientosBD.length > 0) {
      asientosBD.forEach(asientoBD => {
        const index = asientosMemoria.findIndex(am => 
          am.seccion === asientoBD.seccion && 
          am.fila === asientoBD.fila && 
          am.columna === asientoBD.columna
        );
        
        if (index !== -1) {
          asientosMemoria[index] = { ...asientoBD, identificador: obtenerIdentificadorAsiento(asientoBD) };
        }
      });
    }
    
    return asientosMemoria;
  } catch (error) {
    console.error('Error al obtener asientos:', error);
    mostrarToast('Error', 'No se pudieron cargar los asientos del evento.', 'error');
    return [];
  }
}

async function buscarAsientosPorAsistente(idevento, nombreAsistente) {
  try {
    let query = client.from('asientos').select('*').neq('estado', 'Disponible');
    if (idevento) query = query.eq('idevento', idevento);

    const { data, error } = await query.ilike('asistente', `%${nombreAsistente}%`);
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error al buscar asientos:', error);
    mostrarToast('Error', 'No se pudo realizar la búsqueda.', 'error');
    return [];
  }
}

/**
 * Actualiza o crea un asiento en la base de datos
 * @param {Object} asiento Objeto asiento a actualizar/crear
 * @returns {Object|null} Asiento actualizado o null si hay error
 */
async function actualizarAsiento(asiento) {
  try {
    // Si el asiento tiene ID -1 (memoria) y no está disponible, lo creamos
    if (asiento.idasientos === -1 && asiento.estado !== 'Disponible') {
      const nuevoAsiento = {
        seccion: asiento.seccion,
        fila: asiento.fila,
        columna: asiento.columna,
        estado: asiento.estado,
        idevento: asiento.idevento,
        asistente: asiento.asistente || '',
        comentario: asiento.comentario || ''
      };

      const { data, error } = await client
        .from('asientos')
        .insert([nuevoAsiento])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    // Si el asiento existe en BD y se vuelve disponible, lo eliminamos
    else if (asiento.idasientos !== -1 && asiento.estado === 'Disponible') {
      const { error } = await client
        .from('asientos')
        .delete()
        .eq('idasientos', asiento.idasientos);

      if (error) throw error;
      
      // Retornamos el asiento como disponible con ID -1
      return {
        ...asiento,
        idasientos: -1,
        asistente: '',
        comentario: ''
      };
    }
    // Si el asiento existe en BD y no está disponible, lo actualizamos
    else if (asiento.idasientos !== -1) {
      const { data, error } = await client
        .from('asientos')
        .update({
          estado: asiento.estado,
          asistente: asiento.asistente || '',
          comentario: asiento.comentario || ''
        })
        .eq('idasientos', asiento.idasientos)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    
    // Si es un asiento en memoria que se mantiene disponible, no hacemos nada
    return asiento;
  } catch (error) {
    console.error('Error al actualizar asiento:', error);
    mostrarToast('Error', 'No se pudo actualizar el estado del asiento.', 'error');
    return null;
  }
}

/**
 * Elimina una reserva (marca el asiento como disponible)
 * @param {number} asientoId ID del asiento
 * @returns {boolean} True si se eliminó correctamente
 */
async function eliminarReserva(asientoId) {
  try {
    // Si el asiento existe en BD, lo eliminamos
    if (asientoId !== -1) {
      const { error } = await client
        .from('asientos')
        .delete()
        .eq('idasientos', asientoId);

      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    mostrarToast('Error', 'No se pudo eliminar la reserva.', 'error');
    return false;
  }
}

async function guardarReservacion(asientos, estado) {
  try {
    let exito = true;
    const asientosActualizados = [];
    
    for (const asiento of asientos) {
      const result = await actualizarAsiento({ ...asiento, estado });
      if (result) {
        asientosActualizados.push(result);
      } else {
        exito = false;
      }
    }

    if (exito) {
      mostrarToast('Reservación guardada', `Se han ${estado === 'Reservado' ? 'reservado' : 'ocupado'} ${asientos.length} asientos correctamente.`);
      return { success: true, asientos: asientosActualizados };
    } else {
      throw new Error('No se pudieron actualizar todos los asientos');
    }
  } catch (error) {
    console.error('Error al guardar reservación:', error);
    mostrarToast('Error', 'No se pudo completar la reservación.', 'error');
    return { success: false, asientos: [] };
  }
}

/**
 * Calcula estadísticas para un conjunto de asientos
 * @param {Array} asientos Lista de asientos
 * @returns {Object} Estadísticas calculadas
 */
function calcularEstadisticas(asientos) {
  const totalAsientos = asientos.length;
  const disponibles = asientos.filter(a => a.estado === 'Disponible').length;
  const reservados = asientos.filter(a => a.estado === 'Reservado').length;
  const ocupados = asientos.filter(a => a.estado === 'Ocupado').length;
  
  return {
    totalAsientos,
    disponibles,
    reservados,
    ocupados,
    porcentajeDisponibles: totalAsientos > 0 ? (disponibles / totalAsientos) * 100 : 0,
    porcentajeReservados: totalAsientos > 0 ? (reservados / totalAsientos) * 100 : 0,
    porcentajeOcupados: totalAsientos > 0 ? (ocupados / totalAsientos) * 100 : 0
  };
}