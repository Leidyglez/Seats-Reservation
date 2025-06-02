async function obtenerEventos() {
    if (!verificarCredenciales()) return [];
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos?select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener eventos');
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      mostrarToast('Error', 'No se pudieron cargar los eventos.', 'error');
      return [];
    }
  }
  
  /**
   * Crea un nuevo evento
   * @param {Object} evento Datos del evento a crear
   * @returns {Promise<Object|null>} El evento creado con su ID o null si hay error
   */
  async function crearEvento(evento) {
    if (!verificarCredenciales()) return null;
    
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
      
      // Crear el evento
      const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(evento),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear evento');
      }
  
      const eventoCreado = await response.json();
      
      // Crear asientos iniciales para el evento
      await crearAsientosIniciales(eventoCreado[0].id);
      
      mostrarToast('Éxito', 'Evento creado correctamente con todos sus asientos.');
      
      return eventoCreado[0];
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
    if (!verificarCredenciales()) return;
    
    try {
      const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
      const asientos = [];
      
      // Crear asientos para ambas secciones
      for (let seccion = 1; seccion <= 2; seccion++) {
        for (const fila of filas) {
          for (let columna = 1; columna <= 7; columna++) {
            asientos.push({
              seccion,
              fila,
              columna,
              estado: EstadoAsiento.DISPONIBLE,
              eventoId,
            });
          }
        }
      }
      
      // Insertar todos los asientos en lotes para mejorar el rendimiento
      const response = await fetch(`${SUPABASE_URL}/rest/v1/asientos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asientos),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear asientos iniciales');
      }
    } catch (error) {
      console.error("Error al crear asientos iniciales:", error);
      mostrarToast('Error', 'No se pudieron crear los asientos para el evento.', 'error');
    }
  }
  
  /**
   * Obtiene todos los asientos para un evento específico
   * @param {number} eventoId ID del evento
   * @returns {Promise<Array>} Lista de asientos
   */
  async function obtenerAsientos(eventoId) {
    if (!verificarCredenciales()) return [];
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/asientos?eventoId=eq.${eventoId}&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener asientos');
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error al obtener asientos:", error);
      mostrarToast('Error', 'No se pudieron cargar los asientos del evento.', 'error');
      return [];
    }
  }
  
  /**
   * Actualiza el estado de un asiento
   * @param {Object} asiento Datos del asiento a actualizar
   * @returns {Promise<Object|null>} Asiento actualizado o null si hay error
   */
  async function actualizarAsiento(asiento) {
    if (!verificarCredenciales()) return null;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/asientos?id=eq.${asiento.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ estado: asiento.estado }),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar asiento');
      }
  
      const asientoActualizado = await response.json();
      return asientoActualizado[0];
    } catch (error) {
      console.error("Error al actualizar asiento:", error);
      mostrarToast('Error', 'No se pudo actualizar el estado del asiento.', 'error');
      return null;
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
      ocupados
    };
  }