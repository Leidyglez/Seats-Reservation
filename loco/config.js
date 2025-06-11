// Nombres de las colecciones en localStorage
const STORE_EVENTOS = 'auditorioEventos';
const STORE_ASIENTOS = 'auditorioAsientos';

// Estados posibles de un asiento
const EstadoAsiento = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  OCUPADO: "Ocupado"
};

// Colores de la aplicación
const COLORES = {
  PRIMARIO: "#bf2025",   // Rojo auditorio - para asientos ocupados
  SECUNDARIO: "#dddddd", // Fondo general y asientos disponibles
  RESERVADO: "#ffc107"   // Color para asientos reservados (amarillo)
};

// Verificar si localStorage está disponible
const verificarAlmacenamiento = () => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    mostrarToast('Error de almacenamiento', 'El almacenamiento local no está disponible en este navegador.', 'error');
    return false;
  }
};

// Mostrar toast de notificación
function mostrarToast(titulo, mensaje, tipo = 'success') {
  const toastTitulo = document.getElementById('toastTitulo');
  const toastMensaje = document.getElementById('toastMensaje');
  
  toastTitulo.textContent = titulo;
  toastMensaje.textContent = mensaje;
  
  // Aplicar clase según el tipo
  const toastElement = document.getElementById('liveToast');
  toastElement.classList.remove('bg-success', 'bg-warning', 'bg-danger');
  if (tipo === 'error') {
    toastElement.classList.add('bg-danger', 'text-white');
  } else if (tipo === 'warning') {
    toastElement.classList.add('bg-warning');
  } else {
    toastElement.classList.add('bg-success', 'text-white');
  }
  
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

// Formatear fecha para mostrar
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Formatear hora
function formatearHora(horaStr) {
  if (!horaStr) return '';
  return horaStr;
}

// Obtener fecha actual en formato ISO
function obtenerFechaActual() {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD
}

// Obtener hora actual
function obtenerHoraActual() {
  const ahora = new Date();
  return ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}