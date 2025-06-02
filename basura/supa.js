
/**
 * Cliente para gestionar el almacenamiento local
 * Contiene las funciones para gestionar eventos y asientos
 */

/**
 * Obtiene todos los eventos disponibles
 * @returns {Promise<Array>} Lista de eventos
 */
async function obtenerEventos() {
    if (!verificarAlmacenamiento()) return [];
    
    try {
      // Obtener eventos del localStorage
      const eventosJSON = localStorage.getItem(STORE_EVENTOS) || '[]';
      return JSON.parse(eventosJSON);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      mostrarToast('Error', 'No se pudieron cargar los eventos.', 'error');
      return [];
    }
  }
  
  /**
   * Obtiene un evento específico por ID
   * @param {number} eventoId ID del evento
   * @returns {Promise<Object|null>} El evento encontrado o null si no existe
   */
  async function obtenerEventoPorId(eventoId) {
    try {
      const eventos = await obtenerEventos();
      return eventos.find(e => e.id === eventoId) || null;
    } catch (error) {
      console.error("Error al obtener evento:", error);
      return null;
    }
  }
  
  /**
   * Crea un nuevo evento
   * @param {Object} evento Datos del evento a crear
   * @returns {Promise<Object|null>} El evento creado con su ID o null si hay error
   */
  async function crearEvento(evento) {
    if (!verificarAlmacenamiento()) return null;
    
    try {
      // Verificar si ya existe un evento con el mismo nombre y fecha
      const eventosExistentes = await obtenerEventos();
      const eventoExistente = eventosExistentes.find(
        e => e.nombre === evento.nombre && e.fecha === evento.fecha
      );
      
      if (eventoExistente) {
        mostrarToast('Evento duplicado', 'Ya existe un evento con el mismo nombre y fecha.', 'error');
        return null;
      }
      
      // Generar un ID único para el nuevo evento
      const nuevoId = Date.now();
      const nuevoEvento = {
        ...evento,
        id: nuevoId
      };
      
      // Guardar el evento en localStorage
      const eventosActualizados = [...eventosExistentes, nuevoEvento];
      localStorage.setItem(STORE_EVENTOS, JSON.stringify(eventosActualizados));
      
      // Crear asientos iniciales para el evento
      await crearAsientosIniciales(nuevoId);
      
      mostrarToast('Éxito', 'Evento creado correctamente con todos sus asientos.');
      
      return nuevoEvento;
    } catch (error) {
      console.error("Error al crear evento:", error);
      mostrarToast('Error', 'No se pudo crear el evento.', 'error');
      return null;
    }
  }
  
  /**
   * Crea los asientos iniciales para un evento (2 secciones de 15x7)
   * @param {number} eventoId ID del evento
   */
  async function crearAsientosIniciales(eventoId) {
    if (!verificarAlmacenamiento()) return;
    
    try {
      const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
      const asientos = [];
      
      // Obtener asientos existentes (si los hay)
      const asientosExistentes = await obtenerAsientosGenerales();
      
      // Crear asientos para ambas secciones
      for (let seccion = 1; seccion <= 2; seccion++) {
        for (const fila of filas) {
          for (let columna = 1; columna <= 7; columna++) {
            asientos.push({
              id: Date.now() + Math.floor(Math.random() * 10000), // ID único
              seccion,
              fila,
              columna,
              estado: EstadoAsiento.DISPONIBLE,
              eventoId,
              asistente: '', // Campo para almacenar nombre del asistente
              hora: '', // Hora de la reserva
              comentario: '' // Comentario adicional
            });
          }
        }
      }
      
      // Guardar todos los asientos en localStorage
      const asientosActualizados = [...asientosExistentes, ...asientos];
      localStorage.setItem(STORE_ASIENTOS, JSON.stringify(asientosActualizados));
    } catch (error) {
      console.error("Error al crear asientos iniciales:", error);
      mostrarToast('Error', 'No se pudieron crear los asientos para el evento.', 'error');
    }
  }
  
  /**
   * Obtiene todos los asientos almacenados
   * @returns {Promise<Array>} Lista de todos los asientos
   */
  async function obtenerAsientosGenerales() {
    if (!verificarAlmacenamiento()) return [];
    
    try {
      // Obtener todos los asientos
      const asientosJSON = localStorage.getItem(STORE_ASIENTOS) || '[]';
      return JSON.parse(asientosJSON);
    } catch (error) {
      console.error("Error al obtener asientos generales:", error);
      return [];
    }
  }
  
  /**
   * Obtiene todos los asientos para un evento específico
   * @param {number} eventoId ID del evento
   * @returns {Promise<Array>} Lista de asientos
   */
  async function obtenerAsientos(eventoId) {
    if (!verificarAlmacenamiento()) return [];
    
    try {
      // Obtener todos los asientos
      const todosAsientos = await obtenerAsientosGenerales();
      
      // Filtrar solo los asientos del evento seleccionado
      return todosAsientos.filter(asiento => asiento.eventoId === eventoId);
    } catch (error) {
      console.error("Error al obtener asientos:", error);
      mostrarToast('Error', 'No se pudieron cargar los asientos del evento.', 'error');
      return [];
    }
  }
  
  /**
   * Busca asientos por nombre del asistente
   * @param {number} eventoId ID del evento (opcional, si se especifica solo busca en ese evento)
   * @param {string} nombreAsistente Nombre del asistente a buscar
   * @returns {Promise<Array>} Lista de asientos que coinciden con la búsqueda
   */
  async function buscarAsientosPorAsistente(eventoId, nombreAsistente) {
    if (!verificarAlmacenamiento()) return [];
    
    try {
      // Obtener asientos
      let asientos;
      if (eventoId) {
        // Buscar solo en el evento especificado
        asientos = await obtenerAsientos(eventoId);
      } else {
        // Buscar en todos los eventos
        asientos = await obtenerAsientosGenerales();
      }
      
      // Filtrar por nombre de asistente (ignorando mayúsculas/minúsculas)
      const nombreBusqueda = nombreAsistente.toLowerCase().trim();
      return asientos.filter(asiento => 
        asiento.asistente && 
        asiento.asistente.toLowerCase().includes(nombreBusqueda) &&
        asiento.estado !== EstadoAsiento.DISPONIBLE
      );
    } catch (error) {
      console.error("Error al buscar asientos:", error);
      mostrarToast('Error', 'No se pudo realizar la búsqueda.', 'error');
      return [];
    }
  }
  
  /**
   * Actualiza el estado de un asiento
   * @param {Object} asiento Datos del asiento a actualizar
   * @returns {Promise<Object|null>} Asiento actualizado o null si hay error
   */
  async function actualizarAsiento(asiento) {
    if (!verificarAlmacenamiento()) return null;
    
    try {
      // Obtener todos los asientos
      const todosAsientos = await obtenerAsientosGenerales();
      
      // Encontrar y actualizar el asiento específico
      const index = todosAsientos.findIndex(a => a.id === asiento.id);
      
      if (index !== -1) {
        todosAsientos[index] = {
          ...todosAsientos[index],
          estado: asiento.estado,
          asistente: asiento.asistente || todosAsientos[index].asistente,
          hora: asiento.hora || obtenerHoraActual(),
          comentario: asiento.comentario || todosAsientos[index].comentario
        };
        
        // Guardar los cambios
        localStorage.setItem(STORE_ASIENTOS, JSON.stringify(todosAsientos));
        
        return todosAsientos[index];
      }
      
      throw new Error('Asiento no encontrado');
    } catch (error) {
      console.error("Error al actualizar asiento:", error);
      mostrarToast('Error', 'No se pudo actualizar el estado del asiento.', 'error');
      return null;
    }
  }
  
  /**
   * Elimina una reserva (cambia el estado a disponible y elimina los datos del asistente)
   * @param {number} asientoId ID del asiento
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async function eliminarReserva(asientoId) {
    if (!verificarAlmacenamiento()) return false;
    
    try {
      // Obtener todos los asientos
      const todosAsientos = await obtenerAsientosGenerales();
      
      // Encontrar el asiento a liberar
      const index = todosAsientos.findIndex(a => a.id === asientoId);
      
      if (index !== -1) {
        // Restablecer el asiento a disponible
        todosAsientos[index] = {
          ...todosAsientos[index],
          estado: EstadoAsiento.DISPONIBLE,
          asistente: '',
          hora: '',
          comentario: ''
        };
        
        // Guardar los cambios
        localStorage.setItem(STORE_ASIENTOS, JSON.stringify(todosAsientos));
        return true;
      }
      
      throw new Error('Asiento no encontrado');
    } catch (error) {
      console.error("Error al eliminar reserva:", error);
      mostrarToast('Error', 'No se pudo eliminar la reserva.', 'error');
      return false;
    }
  }
  
  /**
   * Guarda una reservación completa (varios asientos)
   * @param {Array} asientos Lista de asientos a reservar
   * @param {string} estado Estado a aplicar (reservado, ocupado)
   * @returns {Promise<boolean>} true si se completó correctamente
   */
  async function guardarReservacion(asientos, estado) {
    if (!verificarAlmacenamiento() || asientos.length === 0) return false;
    
    try {
      // Actualizar cada asiento
      let exito = true;
      
      for (const asiento of asientos) {
        const resultado = await actualizarAsiento({
          ...asiento,
          estado: estado
        });
        
        if (!resultado) exito = false;
      }
      
      if (exito) {
        mostrarToast('Reservación guardada', `Se han ${estado === EstadoAsiento.RESERVADO ? 'reservado' : 'ocupado'} ${asientos.length} asientos correctamente.`);
        return true;
      } else {
        throw new Error('No se pudieron actualizar todos los asientos');
      }
    } catch (error) {
      console.error("Error al guardar reservación:", error);
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