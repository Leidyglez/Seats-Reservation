
/**
 * Archivo principal para la aplicación de Gestión de Auditorio
 * Contiene la lógica para gestionar eventos y asientos usando localStorage
 */

// Elementos del DOM
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const eventoForm = document.getElementById('eventoForm');
const nombreEventoInput = document.getElementById('nombreEvento');
const fechaEventoInput = document.getElementById('fechaEvento');
const horaEventoInput = document.getElementById('horaEvento');
const descripcionEventoInput = document.getElementById('descripcionEvento');
const crearEventoBtn = document.getElementById('crearEventoBtn');
const listaEventos = document.getElementById('listaEventos');
const eventosCargando = document.getElementById('eventosCargando');
const eventosVacio = document.getElementById('eventosVacio');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const eventoSeleccionado = document.getElementById('eventoSeleccionado');
const bienvenida = document.getElementById('bienvenida');
const nombreEventoSeleccionado = document.getElementById('nombreEventoSeleccionado');
const fechaEventoSeleccionado = document.getElementById('fechaEventoSeleccionado');
const horaEventoSeleccionado = document.getElementById('horaEventoSeleccionado');
const descripcionEventoSeleccionado = document.getElementById('descripcionEventoSeleccionado');
const editarEventoBtn = document.getElementById('editarEventoBtn');
const asientosCargando = document.getElementById('asientosCargando');
const seccionesAuditorio = document.getElementById('seccionesAuditorio');
const seccion1 = document.getElementById('seccion1');
const seccion2 = document.getElementById('seccion2');
const asientosSeleccionadosAlert = document.getElementById('asientosSeleccionadosAlert');
const cantidadSeleccionados = document.getElementById('cantidadSeleccionados');
const editarSeleccionadosBtn = document.getElementById('editarSeleccionadosBtn');
const limpiarSeleccionBtn = document.getElementById('limpiarSeleccionBtn');
const guardarReservacionBtn = document.getElementById('guardarReservacionBtn');
const exportarPDFBtn = document.getElementById('exportarPDFBtn');
const estadisticasContainer = document.getElementById('estadisticasContainer');
const totalAsientosSpan = document.getElementById('totalAsientos');
const asientosDisponiblesSpan = document.getElementById('asientosDisponibles');
const asientosReservadosSpan = document.getElementById('asientosReservados');
const asientosOcupadosSpan = document.getElementById('asientosOcupados');
const barraDisponibles = document.getElementById('barraDisponibles');
const barraReservados = document.getElementById('barraReservados');
const barraOcupados = document.getElementById('barraOcupados');
const currentYearSpan = document.getElementById('currentYear');
const busquedaForm = document.getElementById('busquedaForm');
const nombreBusquedaInput = document.getElementById('nombreBusqueda');
const buscarSoloEventoCheck = document.getElementById('buscarSoloEvento');
const buscarReservasBtn = document.getElementById('buscarReservasBtn');
const resultadosBusqueda = document.getElementById('resultadosBusqueda');

// Variables globales
let eventoActual = null;
let asientos = [];
let asientosSeleccionados = [];
let resultadosBusquedaActual = [];

// Inicializar componentes de Bootstrap
const toastElement = document.getElementById('liveToast');
const toast = new bootstrap.Toast(toastElement);
const asientoModal = new bootstrap.Modal(document.getElementById('asientoModal'));
const editarEventoModal = new bootstrap.Modal(document.getElementById('editarEventoModal'));

// Inicializar la aplicación
function inicializarApp() {
  // Establecer el año actual en el pie de página
  currentYearSpan.textContent = new Date().getFullYear();
  
  // Establecer fecha actual como mínimo para los inputs de fecha
  const fechaActual = obtenerFechaActual();
  fechaEventoInput.value = fechaActual;
  fechaEventoInput.min = fechaActual;
  
  // Cargar eventos al iniciar
  cargarEventos();
  
  // Configurar eventos de la interfaz
  configurarEventListeners();
}

// Cargar eventos desde localStorage
async function cargarEventos() {
  eventosCargando.classList.remove('d-none');
  eventosVacio.classList.add('d-none');
  
  const eventos = await obtenerEventos();
  
  eventosCargando.classList.add('d-none');
  
  if (eventos.length === 0) {
    eventosVacio.classList.remove('d-none');
    return;
  }
  
  renderizarEventos(eventos);
}

// Renderizar lista de eventos
function renderizarEventos(eventos) {
  // Limpiar lista de eventos excepto los elementos de carga y vacío
  Array.from(listaEventos.children).forEach(child => {
    if (child !== eventosCargando && child !== eventosVacio) {
      listaEventos.removeChild(child);
    }
  });
  
  // Ordenar eventos por fecha (los más recientes primero)
  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  eventos.forEach(evento => {
    const boton = document.createElement('button');
    boton.className = `btn text-start p-3 mb-2 ${eventoActual && eventoActual.id === evento.id ? 'btn-auditorio-rojo text-white' : 'btn-light'}`;
    
    // Formatear fecha para mostrar
    const fechaFormateada = formatearFecha(evento.fecha);
    const horaFormateada = formatearHora(evento.hora);
    
    boton.innerHTML = `
      <div class="fw-medium">${evento.nombre}</div>
      <small class="text-${eventoActual && eventoActual.id === evento.id ? 'white opacity-75' : 'muted'}">
        ${fechaFormateada}${horaFormateada ? ` · ${horaFormateada}` : ''}
      </small>
    `;
    
    boton.addEventListener('click', () => seleccionarEvento(evento));
    listaEventos.appendChild(boton);
  });
}

// Seleccionar un evento
async function seleccionarEvento(evento) {
  eventoActual = evento;

  
  // Actualizar UI para mostrar el evento seleccionado
  bienvenida.classList.add('d-none');
  eventoSeleccionado.classList.remove('d-none');
  
  nombreEventoSeleccionado.textContent = evento.nombre;
  
  // Formatear fecha para mostrar
  const fechaFormateada = formatearFecha(evento.fecha);
  fechaEventoSeleccionado.textContent = fechaFormateada;
  
  // Mostrar hora si existe
  if (evento.hora) {
    horaEventoSeleccionado.textContent = formatearHora(evento.hora);
    horaEventoSeleccionado.classList.remove('d-none');
  } else {
    horaEventoSeleccionado.classList.add('d-none');
  }
  
  descripcionEventoSeleccionado.textContent = evento.descripcion || '';
  
  // Habilitar botón de exportar PDF
  exportarPDFBtn.disabled = false;
  
  // Ocultar formulario en móviles después de seleccionar un evento
  if (window.innerWidth < 768) {
    sidebar.classList.add('d-none');
    sidebar.classList.remove('d-block');
    toggleFormBtn.textContent = `Volver al menú (Evento: ${evento.nombre})`;
  }
  
  // Renderizar eventos para actualizar la selección
  const eventos = await obtenerEventos();
  renderizarEventos(eventos);
  
  // Cargar asientos del evento
  cargarAsientos(evento.id);
}

// Cargar asientos de un evento
async function cargarAsientos(eventoId) {
  seccionesAuditorio.classList.add('d-none');
  asientosCargando.classList.remove('d-none');
  
  // Limpiar selección de asientos
  asientosSeleccionados = [];
  actualizarUIAsientosSeleccionados();
  
  // Obtener asientos de localStorage
  asientos = await obtenerAsientos(eventoId);
  
  // Mostrar estadísticas
  const estadisticas = calcularEstadisticas(asientos);
  actualizarEstadisticas(estadisticas);
  estadisticasContainer.classList.remove('d-none');
  
  // Renderizar asientos
  renderizarAsientos();
  
  asientosCargando.classList.add('d-none');
  seccionesAuditorio.classList.remove('d-none');
}

// Renderizar asientos en las secciones
function renderizarAsientos() {
  // Limpiar secciones
  seccion1.innerHTML = '';
  seccion2.innerHTML = '';
  
  // Filtrar asientos por sección
  const asientosSeccion1 = asientos.filter(a => a.seccion === 1);
  const asientosSeccion2 = asientos.filter(a => a.seccion === 2);
  
  // Obtener filas únicas ordenadas alfabéticamente
  const filasSeccion1 = [...new Set(asientosSeccion1.map(a => a.fila))].sort();
  const filasSeccion2 = [...new Set(asientosSeccion2.map(a => a.fila))].sort();
  
  // Renderizar asientos de la sección 1
  renderizarAsientosPorSeccion(seccion1, asientosSeccion1, filasSeccion1);
  
  // Renderizar asientos de la sección 2
  renderizarAsientosPorSeccion(seccion2, asientosSeccion2, filasSeccion2);
}

// Renderizar asientos de una sección específica
function renderizarAsientosPorSeccion(contenedor, asientosSeccion, filas) {
  filas.forEach(fila => {
    const filaDiv = document.createElement('div');
    filaDiv.className = 'fila-asientos';
    
    // Etiqueta de la fila
    const filaLabel = document.createElement('span');
    filaLabel.className = 'fila-label';
    filaLabel.textContent = fila;
    filaDiv.appendChild(filaLabel);
    
    // Asientos de la fila, ordenados por columna
    asientosSeccion
      .filter(a => a.fila === fila)
      .sort((a, b) => a.columna - b.columna)
      .forEach(asiento => {
        const asientoDiv = document.createElement('div');
        asientoDiv.className = `asiento asiento-${asiento.estado}`;
        asientoDiv.dataset.id = asiento.id;
        asientoDiv.dataset.seccion = asiento.seccion;
        asientoDiv.dataset.fila = asiento.fila;
        asientoDiv.dataset.columna = asiento.columna;
        asientoDiv.dataset.estado = asiento.estado;
        asientoDiv.dataset.asistente = asiento.asistente || '';
        asientoDiv.dataset.hora = asiento.hora || '';
        asientoDiv.dataset.comentario = asiento.comentario || '';
        asientoDiv.textContent = `${asiento.fila}${asiento.columna}`;
        
        // Verificar si está seleccionado
        if (asientosSeleccionados.some(a => a.id === asiento.id)) {
          asientoDiv.classList.add('seleccionado');
        }
        
        asientoDiv.addEventListener('click', () => toggleSeleccionAsiento(asiento));
        filaDiv.appendChild(asientoDiv);
      });
    
    contenedor.appendChild(filaDiv);
  });
}

// Alternar selección de un asiento
function toggleSeleccionAsiento(asiento) {
  const asientoIndex = asientosSeleccionados.findIndex(a => a.id === asiento.id);
  
  if (asientoIndex === -1) {
    // Agregar a la selección
    asientosSeleccionados.push(asiento);
  } else {
    // Quitar de la selección
    asientosSeleccionados.splice(asientoIndex, 1);
  }
  
  // Actualizar UI
  actualizarUIAsientosSeleccionados();
}

// Actualizar UI según los asientos seleccionados
function actualizarUIAsientosSeleccionados() {
  // Actualizar contador de seleccionados
  if (asientosSeleccionados.length > 0) {
    asientosSeleccionadosAlert.classList.remove('d-none');
    cantidadSeleccionados.textContent = `${asientosSeleccionados.length} asiento(s) seleccionado(s)`;
    guardarReservacionBtn.disabled = false;
  } else {
    asientosSeleccionadosAlert.classList.add('d-none');
    guardarReservacionBtn.disabled = true;
  }
  
  // Actualizar clases de los asientos en el DOM
  document.querySelectorAll('.asiento').forEach(el => {
    const asientoId = parseInt(el.dataset.id);
    if (asientosSeleccionados.some(a => a.id === asientoId)) {
      el.classList.add('seleccionado');
    } else {
      el.classList.remove('seleccionado');
    }
  });
}

// Actualizar estadísticas del evento
function actualizarEstadisticas(stats) {
  // Actualizar números
  totalAsientosSpan.textContent = stats.totalAsientos;
  
  // Calcular porcentajes
  const porcentajeDisponibles = stats.porcentajeDisponibles;
  const porcentajeReservados = stats.porcentajeReservados;
  const porcentajeOcupados = stats.porcentajeOcupados;
  
  // Actualizar disponibles
  asientosDisponiblesSpan.textContent = `${stats.disponibles} (${porcentajeDisponibles.toFixed(1)}%)`;
  barraDisponibles.style.width = `${porcentajeDisponibles}%`;
  barraDisponibles.setAttribute('aria-valuenow', porcentajeDisponibles);
  
  // Actualizar reservados
  asientosReservadosSpan.textContent = `${stats.reservados} (${porcentajeReservados.toFixed(1)}%)`;
  barraReservados.style.width = `${porcentajeReservados}%`;
  barraReservados.setAttribute('aria-valuenow', porcentajeReservados);
  
  // Actualizar ocupados
  asientosOcupadosSpan.textContent = `${stats.ocupados} (${porcentajeOcupados.toFixed(1)}%)`;
  barraOcupados.style.width = `${porcentajeOcupados}%`;
  barraOcupados.setAttribute('aria-valuenow', porcentajeOcupados);
}

// Mostrar modal de asientos
function mostrarModalAsientos() {
  if (asientosSeleccionados.length === 0) return;
  
  const asientoDetalles = document.getElementById('asientoDetalles');
  const modalTitle = document.getElementById('asientoModalLabel');
  
  // Determinar si todos los asientos tienen el mismo estado
  const todosIgualEstado = asientosSeleccionados.every(a => a.estado === asientosSeleccionados[0].estado);
  const estadoActual = todosIgualEstado ? asientosSeleccionados[0].estado : 'múltiple';
  
  // Construir contenido del modal según la cantidad de asientos seleccionados
  let contenido = '';
  
  if (asientosSeleccionados.length === 1) {
    // Un solo asiento seleccionado
    const asiento = asientosSeleccionados[0];
    modalTitle.textContent = 'Detalles de Asiento';
    
    let colorEstado = '';
    if (asiento.estado === EstadoAsiento.DISPONIBLE) colorEstado = 'success';
    else if (asiento.estado === EstadoAsiento.RESERVADO) colorEstado = 'warning';
    else colorEstado = 'danger';
    
    contenido = `
      <p><strong>Sección:</strong> ${asiento.seccion}</p>
      <p><strong>Fila:</strong> ${asiento.fila}</p>
      <p><strong>Columna:</strong> ${asiento.columna}</p>
      <p>
        <strong>Estado actual:</strong>
        <span class="text-${colorEstado}">
          ${asiento.estado.charAt(0).toUpperCase() + asiento.estado.slice(1)}
        </span>
      </p>
      <div class="mb-3">
        <label for="nombreAsistente" class="form-label">Nombre del asistente</label>
        <input type="text" class="form-control" id="nombreAsistente" value="${asiento.asistente || ''}" placeholder="Ingrese el nombre del asistente">
      </div>
      <div class="mb-3">
        <label for="comentarioAsistente" class="form-label">Comentario (opcional)</label>
        <textarea class="form-control" id="comentarioAsistente" rows="2" placeholder="Añadir comentario o información adicional">${asiento.comentario || ''}</textarea>
      </div>
    `;
    
  } else {
    // Múltiples asientos seleccionados
    modalTitle.textContent = 'Detalles de Asientos';
    
    contenido = `
      <p><strong>Asientos seleccionados:</strong> ${asientosSeleccionados.length}</p>
      <div class="mb-3">
        <label for="nombreAsistente" class="form-label">Nombre para todos los asientos seleccionados</label>
        <input type="text" class="form-control" id="nombreAsistente" placeholder="Ingrese un nombre para todos los asientos">
        <div class="form-text">Este nombre se aplicará a todos los asientos seleccionados.</div>
      </div>
      <div class="mb-3">
        <label for="comentarioAsistente" class="form-label">Comentario (opcional)</label>
        <textarea class="form-control" id="comentarioAsistente" rows="2" placeholder="Añadir comentario o información adicional"></textarea>
        <div class="form-text">Este comentario se aplicará a todos los asientos seleccionados.</div>
      </div>
    `;
    
    if (todosIgualEstado) {
      let colorEstado = '';
      if (estadoActual === EstadoAsiento.DISPONIBLE) colorEstado = 'success';
      else if (estadoActual === EstadoAsiento.RESERVADO) colorEstado = 'warning';
      else colorEstado = 'danger';
      
      contenido += `
        <p>
          <strong>Estado actual:</strong>
          <span class="text-${colorEstado}">
            ${estadoActual.charAt(0).toUpperCase() + estadoActual.slice(1)}
          </span>
        </p>
      `;
    }
    
    contenido += `
      <div class="mt-3 mb-1"><strong>Lista de asientos:</strong></div>
      <div style="max-height: 150px; overflow-y: auto;">
        <ul class="list-group">
    `;
    
    asientosSeleccionados.forEach(asiento => {
      let badgeClass = '';
      if (asiento.estado === EstadoAsiento.DISPONIBLE) badgeClass = 'bg-success';
      else if (asiento.estado === EstadoAsiento.RESERVADO) badgeClass = 'bg-warning text-dark';
      else badgeClass = 'bg-danger';
      
      contenido += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Sección ${asiento.seccion}, Fila ${asiento.fila}, Asiento ${asiento.columna}
          ${!todosIgualEstado ? `<span class="badge ${badgeClass}">${asiento.estado}</span>` : ''}
        </li>
      `;
    });
    
    contenido += `
        </ul>
      </div>
    `;
  }
  
  asientoDetalles.innerHTML = contenido;
  asientoModal.show();
}

// Cambiar estado de asientos seleccionados
async function cambiarEstadoAsientos(nuevoEstado) {
  // Si no hay asientos seleccionados, salir
  if (asientosSeleccionados.length === 0) return;
  
  // Obtener el nombre del asistente y comentario si están disponibles
  const nombreAsistenteInput = document.getElementById('nombreAsistente');
  const comentarioAsistenteInput = document.getElementById('comentarioAsistente');
  const nombreAsistente = nombreAsistenteInput ? nombreAsistenteInput.value.trim() : '';
  const comentarioAsistente = comentarioAsistenteInput ? comentarioAsistenteInput.value.trim() : '';
  

  if (!nombreAsistente) {
    mostrarToast('Campo requerido', 'El nombre del asistente es obligatorio.', 'error');
    return;
  }

  // Cerrar modal
  asientoModal.hide();
  
  try {
    // Variable para contar asientos actualizados
    let asientosActualizados = 0;
    
    // Iterar sobre cada asiento seleccionado
    for (const asiento of asientosSeleccionados) {
      // No hacer nada si el estado es el mismo y no hay cambio de asistente ni comentario
      if (asiento.estado === nuevoEstado && asiento.asistente === nombreAsistente && asiento.comentario === comentarioAsistente) continue;
      
      // Actualizar en localStorage
      const asientoActualizado = await actualizarAsiento({
        ...asiento,
        estado: nuevoEstado,
        asistente: nombreAsistente,
        comentario: comentarioAsistente
      });
      
      if (asientoActualizado) {
        // Actualizar en el array local
        const index = asientos.findIndex(a => a.id === asiento.id);
        if (index !== -1) {
          asientos[index] = {
            ...asientos[index],
            estado: nuevoEstado,
            asistente: nombreAsistente,
            hora: asientoActualizado.hora,
            comentario: comentarioAsistente
          };
          asientosActualizados++;
        }
      }
    }
    
    if (asientosActualizados > 0) {
      // Actualizar UI
      renderizarAsientos();
      
      // Actualizar estadísticas
      const nuevasEstadisticas = calcularEstadisticas(asientos);
      actualizarEstadisticas(nuevasEstadisticas);
      
      // Limpiar selección
      asientosSeleccionados = [];
      actualizarUIAsientosSeleccionados();
      
      // Mostrar mensaje de éxito
      mostrarToast('Éxito', `Se han actualizado ${asientosActualizados} asientos.`);
    }
  } catch (error) {
    console.error("Error al cambiar estado de asientos:", error);
    mostrarToast('Error', 'No se pudieron actualizar todos los asientos.', 'error');
  }
}

// Guardar reservación
async function guardarReservacion() {
  if (asientosSeleccionados.length === 0) {
    mostrarToast('Información', 'No hay asientos seleccionados para reservar.', 'warning');
    return;
  }
  
  // Preguntar si está seguro
  if (confirm(`¿Está seguro de que desea reservar ${asientosSeleccionados.length} asientos?`)) {
    // Mostrar modal para ingresar nombre de asistente
    mostrarModalAsientos();
    
    // El guardado real se realiza al hacer clic en los botones del modal
  }
}

// Crear nuevo evento
async function crearNuevoEvento(e) {
  e.preventDefault();
  
  const nombre = nombreEventoInput.value.trim();
  const fecha = fechaEventoInput.value;
  const hora = horaEventoInput.value;
  const descripcion = descripcionEventoInput.value.trim();
  
  if (!nombre) {
    mostrarToast('Campo requerido', 'El nombre del evento es obligatorio.', 'error');
    return;
  }
  
  if (!fecha) {
    mostrarToast('Campo requerido', 'La fecha del evento es obligatoria.', 'error');
    return;
  }
  
  // Deshabilitar botón mientras se crea el evento
  crearEventoBtn.disabled = true;
  crearEventoBtn.innerHTML = 'Creando...';
  
  const evento = {
    nombre,
    fecha,
    hora,
    descripcion
  };
  
  const eventoCreado = await crearEvento(evento);
  
  // Restablecer botón
  crearEventoBtn.disabled = false;
  crearEventoBtn.innerHTML = 'Crear Evento';
  
  if (eventoCreado) {
    // Limpiar formulario
    eventoForm.reset();
    fechaEventoInput.value = obtenerFechaActual();
    
    // Recargar eventos
    await cargarEventos();
    
    // Seleccionar el evento creado
    seleccionarEvento(eventoCreado);
  }
}

// Editar evento
function prepararEdicionEvento() {
  if (!eventoActual) return;
  
  // Rellenar el formulario con los datos actuales
  const editarEventoId = document.getElementById('editarEventoId');
  const editarNombreEvento = document.getElementById('editarNombreEvento');
  const editarFechaEvento = document.getElementById('editarFechaEvento');
  const editarHoraEvento = document.getElementById('editarHoraEvento');
  const editarDescripcionEvento = document.getElementById('editarDescripcionEvento');
  
  editarEventoId.value = eventoActual.id;
  editarNombreEvento.value = eventoActual.nombre;
  editarFechaEvento.value = eventoActual.fecha;
  editarHoraEvento.value = eventoActual.hora || '';
  editarDescripcionEvento.value = eventoActual.descripcion || '';
  
  // Mostrar modal
  editarEventoModal.show();
}

// Guardar evento editado
async function guardarEventoEditado() {
  const editarEventoId = document.getElementById('editarEventoId');
  const editarNombreEvento = document.getElementById('editarNombreEvento');
  const editarFechaEvento = document.getElementById('editarFechaEvento');
  const editarHoraEvento = document.getElementById('editarHoraEvento');
  const editarDescripcionEvento = document.getElementById('editarDescripcionEvento');
  
  const id = parseInt(editarEventoId.value);
  const nombre = editarNombreEvento.value.trim();
  const fecha = editarFechaEvento.value;
  const hora = editarHoraEvento.value;
  const descripcion = editarDescripcionEvento.value.trim();
  
  if (!nombre) {
    mostrarToast('Campo requerido', 'El nombre del evento es obligatorio.', 'error');
    return;
  }
  
  if (!fecha) {
    mostrarToast('Campo requerido', 'La fecha del evento es obligatoria.', 'error');
    return;
  }
  
  try {
    // Obtener todos los eventos
    const eventos = await obtenerEventos();
    
    // Encontrar el evento a editar
    const indice = eventos.findIndex(e => e.id === id);
    
    if (indice !== -1) {
      // Actualizar los datos del evento
      eventos[indice] = {
        ...eventos[indice],
        nombre,
        fecha,
        hora,
        descripcion
      };
      
      // Guardar en localStorage
      localStorage.setItem(STORE_EVENTOS, JSON.stringify(eventos));
      
      // Actualizar eventoActual
      eventoActual = eventos[indice];
      
      // Actualizar UI
      nombreEventoSeleccionado.textContent = nombre;
      fechaEventoSeleccionado.textContent = formatearFecha(fecha);
      
      if (hora) {
        horaEventoSeleccionado.textContent = formatearHora(hora);
        horaEventoSeleccionado.classList.remove('d-none');
      } else {
        horaEventoSeleccionado.classList.add('d-none');
      }
      
      descripcionEventoSeleccionado.textContent = descripcion;
      
      // Cerrar modal
      editarEventoModal.hide();
      
      // Actualizar lista de eventos
      renderizarEventos(eventos);
      
      // Mostrar mensaje de éxito
      mostrarToast('Éxito', 'Evento actualizado correctamente.');
    }
  } catch (error) {
    console.error("Error al editar evento:", error);
    mostrarToast('Error', 'No se pudo actualizar el evento.', 'error');
  }
}

// Buscar reservaciones
async function buscarReservaciones(e) {
  e.preventDefault();
  
  const nombreBusqueda = nombreBusquedaInput.value.trim();
  const buscarSoloEvento = buscarSoloEventoCheck.checked;
  
  if (nombreBusqueda === '') {
    mostrarToast('Campo vacío', 'Ingrese un nombre para buscar.', 'warning');
    return;
  }
  
  try {
    // Obtener ID del evento actual si corresponde
    const eventoId = buscarSoloEvento && eventoActual ? eventoActual.id : null;
    
    // Realizar búsqueda
    resultadosBusquedaActual = await buscarAsientosPorAsistente(eventoId, nombreBusqueda);
    
    // Mostrar resultados
    mostrarResultadosBusqueda(resultadosBusquedaActual, nombreBusqueda);
    
  } catch (error) {
    console.error("Error al buscar reservaciones:", error);
    mostrarToast('Error', 'No se pudieron buscar las reservaciones.', 'error');
  }
}

// Mostrar resultados de búsqueda
async function mostrarResultadosBusqueda(resultados, termino) {
  const contenedorResultados = resultadosBusqueda.querySelector('.resultados-busqueda');
  contenedorResultados.innerHTML = '';
  
  if (resultados.length === 0) {
    resultadosBusqueda.classList.remove('d-none');
    contenedorResultados.innerHTML = `
      <div class="alert alert-info mb-0">
        No se encontraron reservas con el nombre "${termino}".
      </div>
    `;
    return;
  }
  
  // Agrupar por evento
  const eventosPorId = {};
  
  // Cargar información de eventos para cada asiento
  for (const asiento of resultados) {
    if (!eventosPorId[asiento.eventoId]) {
      const evento = await obtenerEventoPorId(asiento.eventoId);
      eventosPorId[asiento.eventoId] = {
        evento,
        asientos: []
      };
    }
    eventosPorId[asiento.eventoId].asientos.push(asiento);
  }
  
  // Construir HTML de resultados agrupados por evento
  const eventosOrdenados = Object.values(eventosPorId).sort((a, b) => {
    // Ordenar por fecha, los más recientes primero
    return new Date(b.evento.fecha) - new Date(a.evento.fecha);
  });
  
  for (const { evento, asientos } of eventosOrdenados) {
    // Crear grupo de resultados por evento
    const grupoEvento = document.createElement('div');
    grupoEvento.className = 'mb-3';
    
    // Encabezado del evento
    const eventoHeader = document.createElement('div');
    eventoHeader.className = 'fw-medium mb-2 p-2 bg-light';
    eventoHeader.innerHTML = `
      ${evento.nombre}
      <small class="d-block text-muted">
        ${formatearFecha(evento.fecha)}${evento.hora ? ` · ${formatearHora(evento.hora)}` : ''}
      </small>
    `;
    grupoEvento.appendChild(eventoHeader);
    
    // Lista de asientos para este evento
    for (const asiento of asientos) {
      const resultadoItem = document.createElement('div');
      resultadoItem.className = 'resultado-asiento p-2 border-bottom d-flex justify-content-between align-items-center';
      
      // Estado del asiento
      let estadoClass = '';
      if (asiento.estado === EstadoAsiento.RESERVADO) estadoClass = 'text-warning';
      else if (asiento.estado === EstadoAsiento.OCUPADO) estadoClass = 'text-danger';
      
      resultadoItem.innerHTML = `
        <div>
          <strong>Sección ${asiento.seccion}, Fila ${asiento.fila}, Asiento ${asiento.columna}</strong>
          <div>
            <span class="${estadoClass}">
              ${asiento.estado.charAt(0).toUpperCase() + asiento.estado.slice(1)}
            </span>
            por <strong>${asiento.asistente}</strong>
            ${asiento.hora ? `<small class="text-muted ms-2">${asiento.hora}</small>` : ''}
          </div>
          ${asiento.comentario ? `<small class="text-muted">${asiento.comentario}</small>` : ''}
        </div>
        <button class="btn btn-sm btn-outline-primary btn-ver-asiento">Ver</button>
      `;
      
      // Botón para ver el asiento
      const verBtn = resultadoItem.querySelector('.btn-ver-asiento');
      verBtn.addEventListener('click', () => {
        verAsientoBuscado(evento, asiento);
      });
      
      grupoEvento.appendChild(resultadoItem);
    }
    
    contenedorResultados.appendChild(grupoEvento);
  }
  
  resultadosBusqueda.classList.remove('d-none');
}

// Ver asiento de búsqueda
async function verAsientoBuscado(evento, asiento) {
  // Si el evento es diferente al actual, cargarlo primero
  if (!eventoActual || eventoActual.id !== evento.id) {
    await seleccionarEvento(evento);
  }
  
  // Una vez cargado el evento, resaltar el asiento
  setTimeout(() => {
    const asientoElement = document.querySelector(`.asiento[data-id="${asiento.id}"]`);
    if (asientoElement) {
      // Hacer scroll hacia el asiento
      asientoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Resaltar el asiento temporalmente
      asientoElement.classList.add('asiento-highlight');
      setTimeout(() => {
        asientoElement.classList.remove('asiento-highlight');
      }, 3000);
      
      // Si estamos en móvil, ocultar el sidebar
      if (window.innerWidth < 768) {
        sidebar.classList.add('d-none');
        sidebar.classList.remove('d-block');
        toggleFormBtn.textContent = `Volver al menú (Evento: ${evento.nombre})`;
      }
    }
  }, 500);
}

// Mostrar u ocultar el sidebar en dispositivos móviles
function toggleSidebar() {
  if (sidebar.classList.contains('d-none')) {
    // Mostrar sidebar
    sidebar.classList.remove('d-none');
    sidebar.classList.add('d-block');
    toggleFormBtn.textContent = "Ocultar menú";
  } else {
    // Ocultar sidebar
    sidebar.classList.add('d-none');
    sidebar.classList.remove('d-block');
    toggleFormBtn.textContent = eventoActual ? `Volver al menú (Evento: ${eventoActual.nombre})` : "Mostrar menú";
  }
}

// Generar PDF del evento
function exportarPDF() {
  if (!eventoActual) return;
  
  mostrarToast('Información', 'Funcionalidad de exportación a PDF en desarrollo.', 'warning');
}

// Configurar event listeners
function configurarEventListeners() {
  // Formulario de evento
  eventoForm.addEventListener('submit', crearNuevoEvento);
  
  // Formulario de búsqueda
  busquedaForm.addEventListener('submit', buscarReservaciones);
  
  // Botón para mostrar/ocultar formulario en móvil
  toggleFormBtn.addEventListener('click', toggleSidebar);
  
  // Botón para editar asientos seleccionados
  editarSeleccionadosBtn.addEventListener('click', mostrarModalAsientos);
  
  // Botón para limpiar selección de asientos
  limpiarSeleccionBtn.addEventListener('click', () => {
    asientosSeleccionados = [];
    actualizarUIAsientosSeleccionados();
  });
  
  // Botón para guardar reservación
  guardarReservacionBtn.addEventListener('click', guardarReservacion);
  
  // Botón para editar evento
  editarEventoBtn.addEventListener('click', prepararEdicionEvento);
  
  // Botón para guardar evento editado
  document.getElementById('guardarEventoEditadoBtn').addEventListener('click', guardarEventoEditado);
  
  // Botón para exportar PDF
  exportarPDFBtn.addEventListener('click', exportarPDF);
  
  // Botones de cambio de estado en el modal
  document.getElementById('btnDisponible').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.DISPONIBLE));
  document.getElementById('btnReservado').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.RESERVADO));
  document.getElementById('btnOcupado').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.OCUPADO));
}

// Iniciar la aplicación cuando se cargue completamente el DOM
document.addEventListener('DOMContentLoaded', inicializarApp);