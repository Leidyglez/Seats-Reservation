document.addEventListener('DOMContentLoaded', function() {
    const rows = 15;
    const cols = 7;
    const sectionCount = 2;
    
    // Estado de los asientos
    let seats = initSeats();
    let selectedSeat = null;
    
    renderSeats();
    
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    
    document.getElementById('reserve-btn').addEventListener('click', reserveSeat);
    document.getElementById('update-btn').addEventListener('click', updateReservation);
    document.getElementById('delete-btn').addEventListener('click', deleteReservation);
    document.getElementById('search-btn').addEventListener('click', searchReservations);
    document.getElementById('delete-all-btn').addEventListener('click', eliminarTodasReservas);
    
    document.querySelector('.card-counter.text-white.bg-secondary').addEventListener('click', () => mostrarModal('disponibles'));
    document.querySelector('.card-counter:not(.bg-secondary)').addEventListener('click', () => mostrarModal('reservados'));
    
    function initSeats() {
        let seatData = [];
        
        // Crear estructura de datos para las secciones y asientos
        for (let section = 1; section <= sectionCount; section++) {
            seatData[section] = [];
            for (let row = 1; row <= rows; row++) {
                seatData[section][row] = [];
                for (let col = 1; col <= cols; col++) {
                    seatData[section][row][col] = {
                        section: section,
                        row: row,
                        col: col,
                        reserved: false,
                        name: ''
                    };
                }
            }
        }
        
        const savedSeats = localStorage.getItem('seatReservations');
        if (savedSeats) {
            return JSON.parse(savedSeats);
        }
        
        return seatData;
    }
    
    // Función para actualizar los contadores de asientos disponibles y reservados
    function updateSeatCounters() {
        let availableCount = 0;
        let reservedCount = 0;

        for (let section = 1; section <= sectionCount; section++) {
            for (let row = 1; row <= rows; row++) {
                for (let col = 1; col <= cols; col++) {
                    const seat = seats[section][row][col];
                    if (seat.reserved) {
                        reservedCount++;
                    } else {
                        availableCount++;
                    }
                }
            }
        }

        document.getElementById('totalDisponibles').textContent = availableCount;
        document.getElementById('totalReservados').textContent = reservedCount;
    }

    // Función para convertir número a letra (para filas)
    function getRowLetter(rowNum) {
        return String.fromCharCode(64 + rowNum); 
    }

    // Función para renderizar los asientos
    function renderSeats() {
        for (let section = 1; section <= sectionCount; section++) {
            const sectionEl = document.getElementById(`section${section}`);
            sectionEl.innerHTML = '';

            for (let row = 1; row <= rows; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'seats-row';
                
                const rowLabel = document.createElement('div');
                rowLabel.className = 'row-label';
                rowLabel.textContent = getRowLetter(row);
                rowDiv.appendChild(rowLabel);

                for (let col = 1; col <= cols; col++) {
                    const seat = seats[section][row][col];
                    const seatDiv = document.createElement('div');

                    seatDiv.className = 'seat ' + (seat.reserved ? 'seat-reserved' : 'seat-available');
                    seatDiv.textContent = seat.reserved ? seat.name.charAt(0).toUpperCase() : `${col}`;

                    seatDiv.dataset.section = section;
                    seatDiv.dataset.row = row;
                    seatDiv.dataset.col = col;
                    
                    seatDiv.addEventListener('click', function() {
                        selectSeat(parseInt(this.dataset.section), parseInt(this.dataset.row), parseInt(this.dataset.col));
                    });

                    rowDiv.appendChild(seatDiv);
                }

                sectionEl.appendChild(rowDiv);
            }
        }

        updateSeatCounters();
    }

    // Función para seleccionar un asiento
    function selectSeat(section, row, col) {
        // Deseleccionar el asiento anterior
        if (selectedSeat) {
            const prevSeatEl = document.querySelector(`.seat[data-section="${selectedSeat.section}"][data-row="${selectedSeat.row}"][data-col="${selectedSeat.col}"]`);
            if (prevSeatEl) {
                prevSeatEl.classList.remove('seat-selected');
                if (seats[selectedSeat.section][selectedSeat.row][selectedSeat.col].reserved) {
                    prevSeatEl.classList.add('seat-reserved');
                } else {
                    prevSeatEl.classList.add('seat-available');
                }
            }
        }
        
        // Seleccionar el nuevo asiento
        const seatEl = document.querySelector(`.seat[data-section="${section}"][data-row="${row}"][data-col="${col}"]`);
        const seatInfo = seats[section][row][col];
        
        selectedSeat = { section, row, col };
        seatEl.classList.remove('seat-available', 'seat-reserved');
        seatEl.classList.add('seat-selected');
        
        // Actualizar la información del asiento seleccionado
        const infoEl = document.getElementById('selected-seat-info');
        infoEl.innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Asiento ${getRowLetter(row)}-${col}</h5>
                    <p class="card-text"><strong>Sección:</strong> ${section}</p>
                    <p class="card-text"><strong>Fila:</strong> ${getRowLetter(row)}</p>
                    <p class="card-text"><strong>Columna:</strong> ${col}</p>
                    <p class="card-text"><strong>Estado:</strong> 
                        <span class="badge ${seatInfo.reserved ? 'bg-danger' : 'bg-success'}">
                            ${seatInfo.reserved ? 'Reservado' : 'Disponible'}
                        </span>
                    </p>
                    ${seatInfo.reserved ? `<p class="card-text"><strong>Reservado por:</strong> ${seatInfo.name}</p>` : ''}
                </div>
            </div>
        `;
        
        // Mostrar el formulario adecuado
        if (seatInfo.reserved) {
            document.getElementById('reservation-form').style.display = 'none';
            document.getElementById('modification-form').style.display = 'block';
            document.getElementById('edit-name').value = seatInfo.name;
        } else {
            document.getElementById('reservation-form').style.display = 'block';
            document.getElementById('modification-form').style.display = 'none';
            document.getElementById('name').value = '';
        }
    }
    
    // Función para reservar un asiento
    function reserveSeat() {
        if (!selectedSeat) {
            showModal('Error', 'Por favor, seleccione un asiento primero.');
            return;
        }
        
        const nameInput = document.getElementById('name');
        const name = nameInput.value.trim();
        
        if (name === '') {
            showModal('Error', 'Por favor, ingrese un nombre para la reserva.');
            return;
        }
        
        const { section, row, col } = selectedSeat;
        
        // Actualizar los datos del asiento
        seats[section][row][col].reserved = true;
        seats[section][row][col].name = name;
        
        saveSeats();
        
        renderSeats();
        
        showModal('Éxito', `Asiento ${getRowLetter(row)}-${col} en la sección ${section} reservado con éxito para ${name}.`);
        
        // Limpiar la selección
        selectedSeat = null;
        document.getElementById('selected-seat-info').innerHTML = '<p class="text-muted">No hay asiento seleccionado</p>';
        document.getElementById('reservation-form').style.display = 'none';

        updateSeatCounters();
    }
    
    // Función para actualizar una reserva
    function updateReservation() {
        if (!selectedSeat) {
            showModal('Error', 'Por favor, seleccione un asiento primero.');
            return;
        }
        
        const nameInput = document.getElementById('edit-name');
        const name = nameInput.value.trim();
        
        if (name === '') {
            showModal('Error', 'Por favor, ingrese un nombre para la reserva.');
            return;
        }
        
        const { section, row, col } = selectedSeat;
        
        // Actualizar los datos del asiento
        seats[section][row][col].name = name;
        
        // Guardar en localStorage
        saveSeats();
        
        // Actualizar la visualización
        renderSeats();
        
        // Mostrar mensaje de éxito
        showModal('Éxito', `Reserva actualizada con éxito para ${name}.`);
        
        // Limpiar la selección
        selectedSeat = null;
        document.getElementById('selected-seat-info').innerHTML = '<p class="text-muted">No hay asiento seleccionado</p>';
        document.getElementById('modification-form').style.display = 'none';
    }
    
    // Función para eliminar una reserva
    function deleteReservation() {
        if (!selectedSeat) {
            showModal('Error', 'Por favor, seleccione un asiento primero.');
            return;
        }
        
        const { section, row, col } = selectedSeat;
        const name = seats[section][row][col].name;
        
        // Actualizar los datos del asiento
        seats[section][row][col].reserved = false;
        seats[section][row][col].name = '';
        
        // Guardar en localStorage
        saveSeats();
        
        // Actualizar la visualización
        renderSeats();
        
        // Mostrar mensaje de éxito
        showModal('Éxito', `Reserva para ${name} eliminada con éxito.`);
        
        // Limpiar la selección
        selectedSeat = null;
        document.getElementById('selected-seat-info').innerHTML = '<p class="text-muted">No hay asiento seleccionado</p>';
        document.getElementById('modification-form').style.display = 'none';

        // Actualizar los contadores
        updateSeatCounters();
    }
    
    // Función para buscar reservas
    function searchReservations() {
        const searchName = document.getElementById('search-name').value.trim().toLowerCase();
        const resultsEl = document.getElementById('search-results');
        
        if (searchName === '') {
            resultsEl.innerHTML = '<p class="text-muted">Ingrese un nombre para buscar.</p>';
            return;
        }
        
        let foundReservations = [];
        
        // Buscar en todas las secciones y asientos
        for (let section = 1; section <= sectionCount; section++) {
            for (let row = 1; row <= rows; row++) {
                for (let col = 1; col <= cols; col++) {
                    const seat = seats[section][row][col];
                    if (seat.reserved && seat.name.toLowerCase().includes(searchName)) {
                        foundReservations.push({
                            section: section,
                            row: row,
                            col: col,
                            name: seat.name
                        });
                    }
                }
            }
        }
        
        // Mostrar resultados
        if (foundReservations.length > 0) {
            let html = '<ul class="list-group mt-3">';
            foundReservations.forEach(res => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>Sección ${res.section}, Fila ${getRowLetter(res.row)}, Col ${res.col}</span>
                        <span class="badge bg-primary rounded-pill">${res.name}</span>
                        <button class="btn btn-sm btn-outline-primary goto-seat-btn" 
                          data-section="${res.section}" 
                          data-row="${res.row}" 
                          data-col="${res.col}">
                          <i class="fas fa-eye"></i>
                        </button>
                    </li>
                `;
            });
            html += '</ul>';
            resultsEl.innerHTML = html;
            
            // Añadir eventos a los botones de "ir a asiento"
            document.querySelectorAll('.goto-seat-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const section = parseInt(this.dataset.section);
                    const row = parseInt(this.dataset.row);
                    const col = parseInt(this.dataset.col);
                    
                    // Seleccionar el asiento
                    selectSeat(section, row, col);
                    
                    // Desplazarse hasta la sección correspondiente
                    document.getElementById(`section${section}`).scrollIntoView({ behavior: 'smooth' });
                });
            });
        } else {
            resultsEl.innerHTML = '<p class="text-muted">No se encontraron reservas con ese nombre.</p>';
        }
    }
    
    // Función para guardar los datos en localStorage
    function saveSeats() {
        localStorage.setItem('seatReservations', JSON.stringify(seats));
    }
    
    // Función para mostrar un modal con información
    function showModal(title, message) {
        const modalTitle = document.getElementById('infoModalLabel');
        const modalBody = document.getElementById('modal-body-content');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = `
            <div class="alert ${title === 'Éxito' ? 'alert-success' : 'alert-danger'} mb-0">
                <i class="fas ${title === 'Éxito' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                ${message}
            </div>
        `;
        
        infoModal.show();
    }

    // Función para mostrar modales de disponibles o reservados
    function mostrarModal(tipo) {
        const modalTitle = document.getElementById('infoModalLabel');
        const modalBody = document.getElementById('modal-body-content');
        
        if (tipo === 'disponibles') {
            modalTitle.textContent = 'Asientos Disponibles';
            
            let availableCount = 0;
            for (let section = 1; section <= sectionCount; section++) {
                for (let row = 1; row <= rows; row++) {
                    for (let col = 1; col <= cols; col++) {
                        if (!seats[section][row][col].reserved) {
                            availableCount++;
                        }
                    }
                }
            }
            
            modalBody.innerHTML = `
                <p>Total de asientos disponibles: <strong>${availableCount}</strong></p>
                <p>Se muestran en color blanco en el mapa de asientos.</p>
            `;
        } else if (tipo === 'reservados') {
            modalTitle.textContent = 'Asientos Reservados';
            
            const reservedSeats = [];
            for (let section = 1; section <= sectionCount; section++) {
                for (let row = 1; row <= rows; row++) {
                    for (let col = 1; col <= cols; col++) {
                        if (seats[section][row][col].reserved) {
                            reservedSeats.push({
                                section,
                                row,
                                col,
                                name: seats[section][row][col].name
                            });
                        }
                    }
                }
            }
            
            if (reservedSeats.length > 0) {
                let html = '<div class="list-group">';
                reservedSeats.forEach(seat => {
                    html += `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Sección ${seat.section}, Fila ${getRowLetter(seat.row)}, Columna ${seat.col}</strong>
                                    <br>
                                    <small>Reservado por: ${seat.name}</small>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary edit-seat-btn" 
                                        data-section="${seat.section}" 
                                        data-row="${seat.row}" 
                                        data-col="${seat.col}">
                                        <i class="fas fa-edit me-1"></i>Editar
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-seat-btn" 
                                        data-section="${seat.section}" 
                                        data-row="${seat.row}" 
                                        data-col="${seat.col}">
                                        <i class="fas fa-trash-alt me-1"></i>Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                modalBody.innerHTML = html;
                
                // Añadir eventos a los botones
                document.querySelectorAll('.edit-seat-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const section = parseInt(this.dataset.section);
                        const row = parseInt(this.dataset.row);
                        const col = parseInt(this.dataset.col);
                        
                        // Cerrar el modal actual
                        infoModal.hide();
                        
                        // Seleccionar el asiento para editar
                        setTimeout(() => {
                            selectSeat(section, row, col);
                        }, 500);
                    });
                });
                
                document.querySelectorAll('.delete-seat-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const section = parseInt(this.dataset.section);
                        const row = parseInt(this.dataset.row);
                        const col = parseInt(this.dataset.col);
                        const name = seats[section][row][col].name;
                        
                        // Actualizar los datos del asiento
                        seats[section][row][col].reserved = false;
                        seats[section][row][col].name = '';
                        
                        // Guardar en localStorage
                        saveSeats();
                        
                        // Actualizar la visualización
                        renderSeats();
                        
                        // Cerrar el modal actual
                        infoModal.hide();
                        
                        // Mostrar mensaje de éxito
                        setTimeout(() => {
                            showModal('Éxito', `Reserva para ${name} eliminada con éxito.`);
                        }, 500);
                    });
                });
            } else {
                modalBody.innerHTML = '<p class="text-muted">No hay asientos reservados actualmente.</p>';
            }
        }
        
        infoModal.show();
    }

    // Función para eliminar todas las reservas
    function eliminarTodasReservas() {
        const confirmacion = confirm('¿Estás seguro de que deseas eliminar todas las reservas? Esta acción no se puede deshacer.');
        if (!confirmacion) return;

        for (let section = 1; section <= sectionCount; section++) {
            for (let row = 1; row <= rows; row++) {
                for (let col = 1; col <= cols; col++) {
                    seats[section][row][col].reserved = false;
                    seats[section][row][col].name = '';
                }
            }
        }

        saveSeats();
        renderSeats();
        
        // Limpiar la selección actual
        selectedSeat = null;
        document.getElementById('selected-seat-info').innerHTML = '<p class="text-muted">No hay asiento seleccionado</p>';
        document.getElementById('reservation-form').style.display = 'none';
        document.getElementById('modification-form').style.display = 'none';
        
        showModal('Éxito', 'Todas las reservas han sido eliminadas con éxito.');
    }
    
    window.mostrarModal = mostrarModal;
    window.eliminarTodasReservas = eliminarTodasReservas;
});