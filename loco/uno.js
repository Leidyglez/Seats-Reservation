
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
const estadoEventoSeleccionado = document.getElementById('estadoEventoSeleccionado');
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

  // Ordenar eventos por fecha (más recientes primero)
  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  eventos.forEach(evento => {
    const esActivo = evento.estado === 'Activo';

    const boton = document.createElement('button');
    boton.className = `btn text-start p-3 mb-2 evento-item ${eventoActual && eventoActual.idevento === evento.idevento ? 'btn-auditorio-rojo text-white' : 'btn-light'} ${esActivo ? '' : 'd-none inactivo'}`;

    const fechaFormateada = formatearFecha(evento.fecha);
    const horaFormateada = formatearHora(evento.hora);

    boton.innerHTML = `
      <div class="fw-medium">${evento.nombre}</div>
      <small class="text-${eventoActual && eventoActual.idevento === evento.idevento ? 'white opacity-75' : 'muted'}">
        ${fechaFormateada}${horaFormateada ? ` · ${horaFormateada}` : ''}
      </small>
    `;

    boton.addEventListener('click', () => seleccionarEvento(evento));
    listaEventos.appendChild(boton);
  });

  // Ocultar mensaje de vacío si hay eventos activos
  const hayActivos = eventos.some(e => e.estado === 'Activo');
  eventosVacio.classList.toggle('d-none', hayActivos);
}


// Seleccionar un evento
async function seleccionarEvento(evento) {
  eventoActual = evento;

  debugger;
  // Actualizar UI para mostrar el evento seleccionado
  bienvenida.classList.add('d-none');
  eventoSeleccionado.classList.remove('d-none');
  
  nombreEventoSeleccionado.textContent = evento.nombre;
  estadoEventoSeleccionado.textContent = evento.estado;
  
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
const eventoid = evento.idevento || evento.id; // Asegurar que usamos el ID correcto

  cargarAsientos(eventoid);
}

// Cargar asientos de un evento
async function cargarAsientos(eventoId) {
  seccionesAuditorio.classList.add('d-none');
  asientosCargando.classList.remove('d-none');
  
  // Limpiar selección de asientos ANTES de cargar nuevos datos
  asientosSeleccionados = [];
  actualizarUIAsientosSeleccionados();
  
  try {
    // Obtener asientos frescos de localStorage
    asientos = await obtenerAsientos(eventoId);
    
    // Verificar que los asientos están actualizados
    console.log('Asientos cargados:', asientos.length);
    
    // Mostrar estadísticas
    const estadisticas = calcularEstadisticas(asientos);
    actualizarEstadisticas(estadisticas);
    estadisticasContainer.classList.remove('d-none');
    
    // Renderizar asientos
    renderizarAsientos();
    
  } catch (error) {
    console.error('Error al cargar asientos:', error);
    mostrarToast('Error', 'No se pudieron cargar los asientos.', 'error');
  } finally {
    asientosCargando.classList.add('d-none');
    seccionesAuditorio.classList.remove('d-none');
  }
}


// Renderizar asientos en las secciones
function renderizarAsientos() {
  // Limpiar secciones completamente
  seccion1.innerHTML = '';
  seccion2.innerHTML = '';
  
  // Filtrar asientos por sección
  const asientosSeccion1 = asientos.filter(a => a.seccion === 1);
  const asientosSeccion2 = asientos.filter(a => a.seccion === 2);
  
  // Obtener filas únicas ordenadas alfabéticamente
  const filasSeccion1 = [...new Set(asientosSeccion1.map(a => a.fila))].sort();
  const filasSeccion2 = [...new Set(asientosSeccion2.map(a => a.fila))].sort();
  
  // Renderizar asientos de cada sección
  renderizarAsientosPorSeccion(seccion1, asientosSeccion1, filasSeccion1);
  renderizarAsientosPorSeccion(seccion2, asientosSeccion2, filasSeccion2);
} 

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
        
        // Determinar la clase CSS según el estado actual del asiento
        let claseEstado = `asiento-${asiento.estado}`;
        
        // Aplicar todas las clases necesarias
        asientoDiv.className = `asiento ${claseEstado}`;
        
        // Configurar atributos de datos (usar identificadores consistentes)
        const asientoId = asiento.id || asiento.idasientos;
        asientoDiv.dataset.id = asientoId;
        asientoDiv.dataset.idasientos = asiento.idasientos;
        asientoDiv.dataset.seccion = asiento.seccion;
        asientoDiv.dataset.fila = asiento.fila;
        asientoDiv.dataset.columna = asiento.columna;
        asientoDiv.dataset.estado = asiento.estado;
        asientoDiv.dataset.asistente = asiento.asistente || '';
        asientoDiv.dataset.hora = asiento.hora || '';
        asientoDiv.dataset.comentario = asiento.comentario || '';
       
        asientoDiv.dataset.identificador = asiento.identificador || obtenerIdentificadorAsiento(asiento);
        
        // Contenido del asiento
        asientoDiv.textContent = `${asiento.fila}${asiento.columna}`;
        
        // Verificar si está seleccionado (usar el ID correcto)
        const estaSeleccionado = asientosSeleccionados.some(a => 
          (a.id && a.id === asientoId) || 
          (a.idasientos && a.idasientos === asiento.idasientos)
        );
        
        if (estaSeleccionado) {
          asientoDiv.classList.add('seleccionado');
        }
        
        // Event listener para selección
        asientoDiv.addEventListener('click', () => toggleSeleccionAsiento(asiento));
        
        filaDiv.appendChild(asientoDiv);
      });
    
    contenedor.appendChild(filaDiv);
  });
}

// Alternar selección de un asiento
function toggleSeleccionAsiento(asiento) {
  // Usar identificador consistente
  const asientoId = asiento.id || asiento.idasientos;
  
  debugger;

  // Buscar el asiento en la selección actual
  const asientoIndex = asientosSeleccionados.findIndex(a => 
   a.identificador === asiento.identificador
  );
  
  if (asientoIndex === -1) {
    // Agregar a la selección
    asientosSeleccionados.push({
      ...asiento,
      id: asientoId // Asegurar que tenga un ID consistente
    });
  } else {
    // Quitar de la selección
    asientosSeleccionados.splice(asientoIndex, 1);
  }
  
  // Actualizar UI
  actualizarUIAsientosSeleccionados();
}

// Actualizar UI según los asientos seleccionados
function actualizarUIAsientosSeleccionados() {
  // Actualizar contador y botones
  if (asientosSeleccionados.length > 0) {
    asientosSeleccionadosAlert.classList.remove('d-none');
    cantidadSeleccionados.textContent = `${asientosSeleccionados.length} asiento(s) seleccionado(s)`;
    guardarReservacionBtn.disabled = false;
    editarSeleccionadosBtn.disabled = false;
  } else {
    asientosSeleccionadosAlert.classList.add('d-none');
    guardarReservacionBtn.disabled = true;
    editarSeleccionadosBtn.disabled = true;
  }
  
  // Actualizar clases visuales de todos los asientos en el DOM
  document.querySelectorAll('.asiento').forEach(el => {
    const asientoId = el.dataset.id;
    const idasientos = el.dataset.idasientos;
    
    // Verificar si está seleccionado
    const estaSeleccionado = asientosSeleccionados.some(a => 
      a.identificador === el.dataset.identificador 
    );
    
    if (estaSeleccionado) {
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
  if (asientosSeleccionados.length === 0) return;
  
  // Obtener datos del modal
  const nombreAsistenteInput = document.getElementById('nombreAsistente');
  const comentarioAsistenteInput = document.getElementById('comentarioAsistente');
  const nombreAsistente = nombreAsistenteInput ? nombreAsistenteInput.value.trim() : '';
  const comentarioAsistente = comentarioAsistenteInput ? comentarioAsistenteInput.value.trim() : '';
  
  // Validar nombre del asistente para reservas y ocupados
  if ((nuevoEstado === EstadoAsiento.RESERVADO || nuevoEstado === EstadoAsiento.OCUPADO) && !nombreAsistente) {
    mostrarToast('Campo requerido', 'El nombre del asistente es obligatorio.', 'error');
    return;
  }
  
  // Cerrar modal
  asientoModal.hide();
  
  try {
    let asientosActualizados = 0;
    const asientosParaActualizar = [...asientosSeleccionados]; // Copia para evitar modificaciones durante el loop
    
    // Actualizar cada asiento
    for (const asiento of asientosParaActualizar) {
      const datosActualizados = {
        ...asiento,
        estado: nuevoEstado,
        asistente: nuevoEstado === EstadoAsiento.DISPONIBLE ? '' : nombreAsistente,
        comentario: nuevoEstado === EstadoAsiento.DISPONIBLE ? '' : comentarioAsistente,
        hora: nuevoEstado === EstadoAsiento.DISPONIBLE ? '' : new Date().toLocaleTimeString()
      };
      
      // Actualizar en localStorage
      const resultado = await actualizarAsiento(datosActualizados);
      
      if (resultado) {
        // Actualizar en el array local
        const index = asientos.findIndex(a => 
          a.identificador === obtenerIdentificadorAsiento(asiento) 
          
        );
        
        if (index !== -1) {
          asientos[index] = { ...asientos[index], ...datosActualizados };
          asientosActualizados++;
        }
      }
    }
    
    if (asientosActualizados > 0) {
      // Limpiar selección ANTES de actualizar UI
      asientosSeleccionados = [];
      
      // Actualizar UI completamente
      renderizarAsientos();
      
      // Actualizar estadísticas
      const nuevasEstadisticas = calcularEstadisticas(asientos);
      actualizarEstadisticas(nuevasEstadisticas);
      
      // Actualizar UI de selección
      actualizarUIAsientosSeleccionados();
      
      // Mensaje de éxito
      const mensaje = nuevoEstado === EstadoAsiento.DISPONIBLE ? 
        `Se han liberado ${asientosActualizados} asientos.` :
        `Se han ${nuevoEstado === EstadoAsiento.RESERVADO ? 'reservado' : 'marcado como ocupados'} ${asientosActualizados} asientos.`;
      
      mostrarToast('Éxito', mensaje);
    } else {
      mostrarToast('Advertencia', 'No se pudo actualizar ningún asiento.', 'warning');
    }
    
  } catch (error) {
    console.error("Error al cambiar estado de asientos:", error);
    mostrarToast('Error', 'Ocurrió un error al actualizar los asientos.', 'error');
  }
}


// Guardar reservación
async function guardarReservacion() {
  if (asientosSeleccionados.length === 0) {
    mostrarToast('Información', 'No hay asientos seleccionados para reservar.', 'warning');
    return;
  }
  
  // Verificar que todos los asientos seleccionados estén disponibles
  const asientosNoDisponibles = asientosSeleccionados.filter(a => a.estado !== EstadoAsiento.DISPONIBLE);
  
  if (asientosNoDisponibles.length > 0) {
    mostrarToast('Error', 'Algunos asientos seleccionados ya no están disponibles. Por favor, actualice la selección.', 'error');
    // Recargar asientos para mostrar el estado actual
    await recargarAsientos();
    return;
  }
  
  // Confirmar la reservación
  if (confirm(`¿Está seguro de que desea reservar ${asientosSeleccionados.length} asientos?`)) {
    mostrarModalAsientos();
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
    
    eventoCreado.id = eventoCreado.idevento; 

    // crearAsientosIniciales(eventoCreado.id);
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
  const estadoEvento = document.getElementById('editarEstadoEvento');

  editarEventoId.value = eventoActual.id;
  editarNombreEvento.value = eventoActual.nombre;
  editarFechaEvento.value = eventoActual.fecha;
  editarHoraEvento.value = eventoActual.hora || '';
  editarDescripcionEvento.value = eventoActual.descripcion || '';
  estadoEvento.value = eventoActual.estado || '';
  debugger;
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
  const estadoEvento = document.getElementById('editarEstadoEvento');
  
  const id = parseInt(editarEventoId.value);
  const nombre = editarNombreEvento.value.trim();
  const fecha = editarFechaEvento.value;
  const hora = editarHoraEvento.value;
  const descripcion = editarDescripcionEvento.value.trim();
  const estado = estadoEvento.value;
  
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
    debugger;
    if (indice !== -1) {
      // Actualizar los datos del evento
      eventos[indice] = {
        ...eventos[indice],
        nombre,
        fecha,
        hora,
        descripcion,
        estado
      };
      
      // Guardar en localStorage
      await editarEvento(eventos[indice].idevento, eventos[indice]);

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
      estadoEventoSeleccionado.textContent = estado;
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
    const eventoId = buscarSoloEvento && eventoActual ? eventoActual.idevento : null;
    
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
    if (!eventosPorId[asiento.idevento]) {
      const evento = await obtenerEventoPorId(asiento.idevento);
      eventosPorId[asiento.idevento] = {
        evento,
        asientos: []
      };
    }
    eventosPorId[asiento.idevento].asientos.push(asiento);
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
  if (!eventoActual || eventoActual.idevento !== evento.idevento) {
    await seleccionarEvento(evento);
  }
  
  // Una vez cargado el evento, resaltar el asiento
  setTimeout(() => {
    const asientoElement = document.querySelector(`.asiento[data-id="${asiento.idasientos}"]`);

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

document.getElementById('eventoBusqueda').addEventListener('input', function () {
  const filtro = this.value.toLowerCase().trim();
  const eventos = document.querySelectorAll('#listaEventos .evento-item');

  let algunoVisible = false;

  eventos.forEach(evento => {
    const texto = evento.textContent.toLowerCase();
    const coincide = texto.includes(filtro);

    // Mostrar si coincide aunque sea inactivo
    evento.classList.toggle('d-none', !coincide);
    if (coincide) algunoVisible = true;
  });

  document.getElementById('eventosVacio').classList.toggle('d-none', algunoVisible);
});



// Iniciar la aplicación cuando se cargue completamente el DOM
document.addEventListener('DOMContentLoaded', inicializarApp);