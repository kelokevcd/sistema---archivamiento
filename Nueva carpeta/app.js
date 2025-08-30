// Elementos del DOM
const searchInput = document.getElementById('search-input');
const yearFilter = document.getElementById('year-filter');
const categoryFilter = document.getElementById('category-filter');
const dateFilter = document.getElementById('date-filter');
const gridViewBtn = document.getElementById('grid-view');
const listViewBtn = document.getElementById('list-view');
const diariesContainer = document.getElementById('diaries-container');
const uploadButton = document.getElementById('upload-button');
const uploadFirstDiary = document.getElementById('upload-first-diary');
const uploadModal = document.getElementById('upload-modal');
const statsButton = document.getElementById('stats-button');
const statsModal = document.getElementById('stats-modal');
const databaseButton = document.getElementById('database-button');
const uploadForm = document.getElementById('upload-form');
const closeButtons = document.querySelectorAll('.close');

// Estado de la aplicación
let diaries = [];
let filteredDiaries = [];
let categories = new Set();
let years = new Set();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadDiariesFromStorage();
    setupEventListeners();
    updateUI();
});

// Cargar diarios desde localStorage
function loadDiariesFromStorage() {
    const storedDiaries = localStorage.getItem('diaries');
    if (storedDiaries) {
        diaries = JSON.parse(storedDiaries);
        filteredDiaries = [...diaries];
        
        // Extraer categorías y años únicos
        diaries.forEach(diary => {
            categories.add(diary.category);
            const year = new Date(diary.date).getFullYear();
            years.add(year);
        });
        
        // Actualizar filtros
        updateFilters();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botones de vista
    gridViewBtn.addEventListener('click', () => {
        diariesContainer.className = 'grid-view';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    });
    
    listViewBtn.addEventListener('click', () => {
        diariesContainer.className = 'list-view';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    });
    
    // Filtros
    searchInput.addEventListener('input', filterDiaries);
    yearFilter.addEventListener('change', filterDiaries);
    categoryFilter.addEventListener('change', filterDiaries);
    dateFilter.addEventListener('change', filterDiaries);
    
    // Modales
    uploadButton.addEventListener('click', () => {
        uploadModal.style.display = 'flex';
    });
    
    uploadFirstDiary.addEventListener('click', () => {
        uploadModal.style.display = 'flex';
    });
    
    statsButton.addEventListener('click', () => {
        updateStats();
        statsModal.style.display = 'flex';
    });
    
    // Botón de base de datos
    databaseButton.addEventListener('click', () => {
        // Preguntar al usuario si quiere ver la estructura o el visor de base de datos
        const viewStructure = confirm('¿Desea ver la estructura de la base de datos? Presione Cancelar para ir al visor de datos.');
        
        if (viewStructure) {
            window.location.href = 'database-structure.html';
        } else {
            window.location.href = 'database-viewer.html';
        }
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            uploadModal.style.display = 'none';
            statsModal.style.display = 'none';
        });
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.style.display = 'none';
        }
        if (e.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });
    
    // Formulario de subida
    uploadForm.addEventListener('submit', handleDiaryUpload);
}

// Función mejorada para manejar la subida de diarios
function handleDiaryUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('diary-title').value;
    const category = document.getElementById('diary-category').value;
    const date = document.getElementById('diary-date').value;
    const file = document.getElementById('diary-file').files[0];
    
    if (!title || !category || !date || !file) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    // Mostrar indicador de carga
    const submitButton = document.querySelector('#upload-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Subiendo...';
    submitButton.disabled = true;
    
    // Convertir archivo a Base64 para almacenamiento permanente
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = e.target.result; // Base64 string
        
        // Crear nuevo diario con datos persistentes
        const newDiary = {
            id: Date.now().toString(),
            title,
            category,
            date,
            fileData, // Base64 data para persistencia
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadDate: new Date().toISOString()
        };
        
        // Añadir a la lista de diarios
        diaries.push(newDiary);
        filteredDiaries = [...diaries];
        
        // Actualizar categorías y años
        categories.add(category);
        const year = new Date(date).getFullYear();
        years.add(year);
        
        // Guardar en localStorage
        saveDiariesToStorage();
        
        // Actualizar UI
        updateFilters();
        updateUI();
        
        // Restaurar botón y cerrar modal
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        uploadModal.style.display = 'none';
        uploadForm.reset();
        
        alert('Archivo subido exitosamente y guardado permanentemente');
    };
    
    reader.onerror = function() {
        alert('Error al procesar el archivo');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    };
    
    // Leer archivo como Base64
    reader.readAsDataURL(file);
}

// Función mejorada para crear tarjetas de diarios
function createDiaryCard(diary) {
    const card = document.createElement('div');
    card.className = 'diary-card';
    
    // Crear URL del archivo desde Base64 almacenado
    let fileURL;
    if (diary.fileData) {
        // Archivo almacenado como Base64
        fileURL = diary.fileData;
    } else if (diary.fileURL) {
        // Compatibilidad con archivos antiguos (URL temporal)
        fileURL = diary.fileURL;
    }
    
    const formattedDate = new Date(diary.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const uploadDate = new Date(diary.uploadDate).toLocaleDateString('es-ES');
    
    card.innerHTML = `
        <div class="diary-header">
            <h3>${diary.title}</h3>
            <button class="delete-btn" onclick="deleteDiary('${diary.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="diary-info">
            <p><strong>Categoría:</strong> ${diary.category}</p>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Archivo:</strong> ${diary.fileName}</p>
            <p><strong>Subido:</strong> ${uploadDate}</p>
        </div>
        <div class="diary-actions">
            <button class="view-btn" onclick="viewDiary('${fileURL}', '${diary.fileName}')">
                <i class="fas fa-eye"></i> Ver PDF
            </button>
            <button class="download-btn" onclick="downloadDiary('${fileURL}', '${diary.fileName}')">
                <i class="fas fa-download"></i> Descargar
            </button>
        </div>
    `;
    
    return card;
}

// Nueva función para ver archivos PDF
function viewDiary(fileData, fileName) {
    if (fileData.startsWith('data:')) {
        // Archivo Base64 - crear blob URL temporal para visualización
        const byteCharacters = atob(fileData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Abrir en nueva ventana
        window.open(url, '_blank');
        
        // Limpiar URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
        // URL temporal (compatibilidad)
        window.open(fileData, '_blank');
    }
}

// Nueva función para descargar archivos
function downloadDiary(fileData, fileName) {
    if (fileData.startsWith('data:')) {
        // Archivo Base64 - crear enlace de descarga
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        // URL temporal (compatibilidad)
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Guardar diarios en localStorage
function saveDiariesToStorage() {
    localStorage.setItem('diaries', JSON.stringify(diaries));
}

// Actualizar los filtros de año y categoría
function updateFilters() {
    // Limpiar opciones actuales
    yearFilter.innerHTML = '<option value="">Todos los años</option>';
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    // Añadir años
    const sortedYears = Array.from(years).sort((a, b) => b - a); // Ordenar descendente
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    
    // Añadir categorías
    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Actualizar datalist para el formulario
    const categoriesList = document.getElementById('categories');
    categoriesList.innerHTML = '';
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        categoriesList.appendChild(option);
    });
}

// Filtrar diarios según los criterios seleccionados
function filterDiaries() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedYear = yearFilter.value;
    const selectedCategory = categoryFilter.value;
    const selectedDate = dateFilter.value;
    
    filteredDiaries = diaries.filter(diary => {
        // Filtrar por término de búsqueda
        const matchesSearch = diary.title.toLowerCase().includes(searchTerm) || 
                             diary.category.toLowerCase().includes(searchTerm);
        
        // Filtrar por año
        const diaryYear = new Date(diary.date).getFullYear().toString();
        const matchesYear = !selectedYear || diaryYear === selectedYear;
        
        // Filtrar por categoría
        const matchesCategory = !selectedCategory || diary.category === selectedCategory;
        
        // Filtrar por fecha específica
        const matchesDate = !selectedDate || diary.date === selectedDate;
        
        return matchesSearch && matchesYear && matchesCategory && matchesDate;
    });
    
    updateUI();
}

// Actualizar la interfaz de usuario
function updateUI() {
    if (diaries.length === 0) {
        // Mostrar estado vacío
        diariesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-archive"></i>
                </div>
                <h2>No hay diarios para mostrar</h2>
                <p>Comienza subiendo tus primeros diarios PDF</p>
                <button id="upload-first-diary" class="primary-button">Subir Primer Diario</button>
            </div>
        `;
        // Volver a añadir event listener al botón
        document.getElementById('upload-first-diary').addEventListener('click', () => {
            uploadModal.style.display = 'flex';
        });
    } else if (filteredDiaries.length === 0) {
        // Mostrar mensaje de no resultados
        diariesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h2>No se encontraron resultados</h2>
                <p>Intenta con otros criterios de búsqueda</p>
            </div>
        `;
    } else {
        // Mostrar diarios filtrados
        diariesContainer.innerHTML = '';
        
        filteredDiaries.forEach(diary => {
            const diaryCard = createDiaryCard(diary);
            diariesContainer.appendChild(diaryCard);
        });
    }
}

// Crear una tarjeta de diario
function createDiaryCard(diary) {
    const card = document.createElement('div');
    card.className = 'diary-card';
    
    const formattedDate = new Date(diary.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    card.innerHTML = `
        <div class="card-header">
            <h3>${diary.title}</h3>
            <span class="category">${diary.category}</span>
        </div>
        <div class="card-body">
            <div class="date">
                <i class="far fa-calendar-alt"></i>
                <span>${formattedDate}</span>
            </div>
            <p class="file-name">${diary.fileName}</p>
        </div>
        <div class="card-actions">
            <button class="view-diary" data-id="${diary.id}">
                <i class="far fa-eye"></i> Ver
            </button>
            <button class="delete-diary" data-id="${diary.id}">
                <i class="far fa-trash-alt"></i> Eliminar
            </button>
        </div>
    `;
    
    // Añadir event listeners a los botones
    card.querySelector('.view-diary').addEventListener('click', () => {
        window.open(diary.fileURL, '_blank');
    });
    
    card.querySelector('.delete-diary').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas eliminar este diario?')) {
            deleteDiary(diary.id);
        }
    });
    
    return card;
}

// Eliminar un diario
function deleteDiary(id) {
    const index = diaries.findIndex(diary => diary.id === id);
    if (index !== -1) {
        // Liberar URL del objeto
        URL.revokeObjectURL(diaries[index].fileURL);
        
        // Eliminar diario
        diaries.splice(index, 1);
        filteredDiaries = filteredDiaries.filter(diary => diary.id !== id);
        
        // Recalcular categorías y años
        recalculateCategoriesAndYears();
        
        // Guardar cambios
        saveDiariesToStorage();
        
        // Actualizar UI
        updateFilters();
        updateUI();
    }
}

// Recalcular categorías y años después de eliminar
function recalculateCategoriesAndYears() {
    categories.clear();
    years.clear();
    
    diaries.forEach(diary => {
        categories.add(diary.category);
        const year = new Date(diary.date).getFullYear();
        years.add(year);
    });
}

// Actualizar estadísticas
function updateStats() {
    const totalDiaries = document.getElementById('total-diaries');
    const totalCategories = document.getElementById('total-categories');
    const mostActiveYear = document.getElementById('most-active-year');
    
    totalDiaries.textContent = diaries.length;
    totalCategories.textContent = categories.size;
    
    // Calcular año con más diarios
    if (years.size > 0) {
        const yearCounts = {};
        diaries.forEach(diary => {
            const year = new Date(diary.date).getFullYear();
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        });
        
        let maxYear = null;
        let maxCount = 0;
        
        for (const year in yearCounts) {
            if (yearCounts[year] > maxCount) {
                maxCount = yearCounts[year];
                maxYear = year;
            }
        }
        
        mostActiveYear.textContent = maxYear ? `${maxYear} (${maxCount} diarios)` : '-';
    } else {
        mostActiveYear.textContent = '-';
    }
    
    // Crear gráfico
    createChart();
}

// Crear gráfico de estadísticas
function createChart() {
    const ctx = document.getElementById('diaries-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (window.diariesChart) {
        window.diariesChart.destroy();
    }
    
    // Preparar datos para el gráfico
    const yearCounts = {};
    diaries.forEach(diary => {
        const year = new Date(diary.date).getFullYear();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    const years = Object.keys(yearCounts).sort();
    const counts = years.map(year => yearCounts[year]);
    
    // Crear nuevo gráfico
    window.diariesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Número de Diarios',
                data: counts,
                backgroundColor: '#b91942',
                borderColor: '#b91942',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}