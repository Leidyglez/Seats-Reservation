// Inicialización de Supabase
const supabaseUrl = 'https://mahtgbesmlplwzxrqquw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haHRnYmVzbWxwbHd6eHJxcXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODkxNzksImV4cCI6MjA2MjA2NTE3OX0.iPQRjkJkvNK84_Arxd5hN0rnZv8b4g4b3X06HERjY94';

const client = supabase.createClient(supabaseUrl, supabaseKey);

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
    const { data, error } = await client.from('eventos').select('*').eq('id', idevento).single();
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

    await crearAsientosIniciales(data.id);
    mostrarToast('Éxito', 'Evento creado correctamente con todos sus asientos.');
    return data;
  } catch (error) {
    console.error('Error al crear evento:', error);
    mostrarToast('Error', 'No se pudo crear el evento.', 'error');
    return null;
  }
}

async function crearAsientosIniciales(idevento) {
  try {
    const filas = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
    const asientos = [];

    for (let seccion = 1; seccion <= 2; seccion++) {
      for (const fila of filas) {
        for (let columna = 1; columna <= 7; columna++) {
          asientos.push({
            seccion,
            fila,
            columna,
            estado: 'Disponible',
            idevento: idevento,
            asistente: '',
            comentario: ''
          });
        }
      }
    }

    const { error } = await client.from('asientos').insert(asientos);
    if (error) throw error;
  } catch (error) {
    console.error('Error al crear asientos iniciales:', error);
    mostrarToast('Error', 'No se pudieron crear los asientos para el evento.', 'error');
  }
}

async function obtenerAsientosGenerales() {
  try {
    const { data, error } = await client.from('asientos').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener asientos generales:', error);
    return [];
  }
}

async function obtenerAsientos(idevento) {
  try {
    const { data, error } = await client.from('asientos').select('*').eq('idevento', idevento);
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener asientos:', error);
    mostrarToast('Error', 'No se pudieron cargar los asientos del evento.', 'error');
    return [];
  }
}

async function buscarAsientosPorAsistente(idevento, nombreAsistente) {
  try {
    let query = client.from('asientos').select('*');
    if (idevento) query = query.eq('idevento', idevento);

    const { data, error } = await query.ilike('asistente', `%${nombreAsistente}%`);
    if (error) throw error;

    return data.filter(a => a.estado !== 'Disponible');
  } catch (error) {
    console.error('Error al buscar asientos:', error);
    mostrarToast('Error', 'No se pudo realizar la búsqueda.', 'error');
    return [];
  }
}

async function actualizarAsiento(asiento) {
  try {
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
  } catch (error) {
    console.error('Error al actualizar asiento:', error);
    mostrarToast('Error', 'No se pudo actualizar el estado del asiento.', 'error');
    return null;
  }
}

async function eliminarReserva(asientoId) {
  try {
    const { error } = await client
      .from('asientos')
      .update({ estado: 'Disponible', asistente: '', comentario: '' })
      .eq('idasientos', asientoId);

    if (error) throw error;
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
    for (const asiento of asientos) {
      const result = await actualizarAsiento({ ...asiento, estado });
      if (!result) exito = false;
    }

    if (exito) {
      mostrarToast('Reservación guardada', `Se han ${estado === 'Reservado' ? 'reservado' : 'ocupado'} ${asientos.length} asientos correctamente.`);
      return true;
    } else {
      throw new Error('No se pudieron actualizar todos los asientos');
    }
  } catch (error) {
    console.error('Error al guardar reservación:', error);
    mostrarToast('Error', 'No se pudo completar la reservación.', 'error');
    return false;
  }
}


  /**
   * Calcula estadísticas para un conjunto de asientos
   * @param {Array} asientos Lista de asientos
   * @returns {Object} Estadísticas calculadas
   */
  function calcularEstadisticas(asientos) {
    const totalAsientos = asientos.length;
    const disponibles = asientos.filter(a => a.estado === EstadoAsiento.DISPONIBLE).length;
    const reservados = asientos.filter(a => a.estado === EstadoAsiento.RESERVADO).length;
    const ocupados = asientos.filter(a => a.estado === EstadoAsiento.OCUPADO).length;
    
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