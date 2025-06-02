const supabaseUrl = 'https://mahtgbesmlplwzxrqquw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haHRnYmVzbWxwbHd6eHJxcXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODkxNzksImV4cCI6MjA2MjA2NTE3OX0.iPQRjkJkvNK84_Arxd5hN0rnZv8b4g4b3X06HERjY94';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);


// Elementos del DOM
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const eventoForm = document.getElementById('eventoForm');
const nombreEventoInput = document.getElementById('nombreEvento');
const fechaEventoInput = document.getElementById('fechaEvento');
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
const descripcionEventoSeleccionado = document.getElementById('descripcionEventoSeleccionado');
const asientosCargando = document.getElementById('asientosCargando');
const seccionesAuditorio = document.getElementById('seccionesAuditorio');
const seccion1 = document.getElementById('seccion1');
const seccion2 = document.getElementById('seccion2');
const asientosSeleccionadosAlert = document.getElementById('asientosSeleccionadosAlert');
const cantidadSeleccionados = document.getElementById('cantidadSeleccionados');
const editarSeleccionadosBtn = document.getElementById('editarSeleccionadosBtn');
const limpiarSeleccionBtn = document.getElementById('limpiarSeleccionBtn');
const estadisticasContainer = document.getElementById('estadisticasContainer');
const totalAsientosSpan = document.getElementById('totalAsientos');
const asientosDisponiblesSpan = document.getElementById('asientosDisponibles');
const asientosReservadosSpan = document.getElementById('asientosReservados');
const asientosOcupadosSpan = document.getElementById('asientosOcupados');
const barraDisponibles = document.getElementById('barraDisponibles');
const barraReservados = document.getElementById('barraReservados');
const barraOcupados = document.getElementById('barraOcupados');
const currentYearSpan = document.getElementById('currentYear');

// Variables globales
let eventoActual = null;
let asientos = [];
let asientosSeleccionados = [];

// Inicializar componentes de Bootstrap
const toastElement = document.getElementById('liveToast');
const toast = new bootstrap.Toast(toastElement);
const asientoModal = new bootstrap.Modal(document.getElementById('asientoModal'));

// Inicializar la aplicación
function inicializarApp() {
  // Establecer el año actual en el pie de página
  currentYearSpan.textContent = new Date().getFullYear();
  
  // Cargar eventos al iniciar
  cargarEventos();
  
  // Configurar eventos de la interfaz
  configurarEventListeners();
}

// Cargar eventos desde Supabase
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
  
  eventos.forEach(evento => {
    const boton = document.createElement('button');
    boton.className = `btn text-start p-3 mb-2 ${eventoActual && eventoActual.id === evento.id ? 'btn-auditorio-rojo text-white' : 'btn-light'}`;
    
    // Formatear fecha para mostrar
    const fecha = new Date(evento.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    boton.innerHTML = `
      <div class="fw-medium">${evento.nombre}</div>
      <small class="text-${eventoActual && eventoActual.id === evento.id ? 'white opacity-75' : 'muted'}">${fechaFormateada}</small>
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
  const fecha = new Date(evento.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  fechaEventoSeleccionado.textContent = fechaFormateada;
  descripcionEventoSeleccionado.textContent = evento.descripcion || '';
  
  // Ocultar formulario en móviles después de seleccionar un evento
  if (window.innerWidth < 768) {
    sidebar.classList.add('d-none');
    sidebar.classList.remove('d-block');
    toggleFormBtn.textContent = `Volver al menú (Evento actual: ${evento.nombre})`;
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
  
  // Obtener asientos de Supabase
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
  } else {
    asientosSeleccionadosAlert.classList.add('d-none');
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
  const porcentajeDisponibles = (stats.disponibles / stats.totalAsientos) * 100;
  const porcentajeReservados = (stats.reservados / stats.totalAsientos) * 100;
  const porcentajeOcupados = (stats.ocupados / stats.totalAsientos) * 100;
  
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
    `;
  } else {
    // Múltiples asientos seleccionados
    modalTitle.textContent = 'Detalles de Asientos';
    
    contenido = `
      <p><strong>Asientos seleccionados:</strong> ${asientosSeleccionados.length}</p>
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
  
  // Cerrar modal
  asientoModal.hide();
  
  try {
    // Variable para contar asientos actualizados
    let asientosActualizados = 0;
    
    // Iterar sobre cada asiento seleccionado
    for (const asiento of asientosSeleccionados) {
      // No hacer nada si el estado es el mismo
      if (asiento.estado === nuevoEstado) continue;
      
      // Actualizar en la base de datos
      const asientoActualizado = await actualizarAsiento({
        ...asiento,
        estado: nuevoEstado
      });
      
      if (asientoActualizado) {
        // Actualizar en el array local
        const index = asientos.findIndex(a => a.id === asiento.id);
        if (index !== -1) {
          asientos[index].estado = nuevoEstado;
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

// Crear nuevo evento
async function crearNuevoEvento(e) {
  e.preventDefault();
  
  const nombre = nombreEventoInput.value.trim();
  const fecha = fechaEventoInput.value;
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
    descripcion
  };
  
  const eventoCreado = await crearEvento(evento);
  
  // Restablecer botón
  crearEventoBtn.disabled = false;
  crearEventoBtn.innerHTML = 'Crear Evento';
  
  if (eventoCreado) {
    // Limpiar formulario
    eventoForm.reset();
    
    // Recargar eventos
    await cargarEventos();
    
    // Seleccionar el evento creado
    seleccionarEvento(eventoCreado);
  }
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
    toggleFormBtn.textContent = eventoActual ? `Volver al menú (Evento actual: ${eventoActual.nombre})` : "Mostrar menú";
  }
}

// Mostrar toast de notificación
function mostrarToast(titulo, mensaje, tipo = 'success') {
  const toastTitulo = document.getElementById('toastTitulo');
  const toastMensaje = document.getElementById('toastMensaje');
  
  toastTitulo.textContent = titulo;
  toastMensaje.textContent = mensaje;
  
  // Aplicar clase según el tipo
  toastElement.classList.remove('bg-success', 'bg-warning', 'bg-danger');
  if (tipo === 'error') {
    toastElement.classList.add('bg-danger', 'text-white');
  } else if (tipo === 'warning') {
    toastElement.classList.add('bg-warning');
  } else {
    toastElement.classList.add('bg-success', 'text-white');
  }
  
  toast.show();
}

// Configurar event listeners
function configurarEventListeners() {
  // Formulario de evento
  eventoForm.addEventListener('submit', crearNuevoEvento);
  
  // Botón para mostrar/ocultar formulario en móvil
  toggleFormBtn.addEventListener('click', toggleSidebar);
  
  // Botón para editar asientos seleccionados
  editarSeleccionadosBtn.addEventListener('click', mostrarModalAsientos);
  
  // Botón para limpiar selección de asientos
  limpiarSeleccionBtn.addEventListener('click', () => {
    asientosSeleccionados = [];
    actualizarUIAsientosSeleccionados();
  });
  
  // Botones de cambio de estado en el modal
  document.getElementById('btnDisponible').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.DISPONIBLE));
  document.getElementById('btnReservado').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.RESERVADO));
  document.getElementById('btnOcupado').addEventListener('click', () => cambiarEstadoAsientos(EstadoAsiento.OCUPADO));
}

// Iniciar la aplicación cuando se cargue completamente el DOM
document.addEventListener('DOMContentLoaded', inicializarApp);