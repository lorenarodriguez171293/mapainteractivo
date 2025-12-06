// ===============================================
// 1. Datos de las Centrales
// ===============================================

// Coordenadas simuladas de las plantas en Argentina
// Estructura de datos: [Latitud, Longitud, Nombre, Tipo, Provincia, Potencia, Año]
const centralesData = [
    // Eólicas (🌀)
    [-43.08, -65.20, 'Parque Eólico Rawson', 'eolica', 'Chubut', 108, 2012],
    [-52.07, -69.21, 'Parque Eólico Vientos de la Patagonia I', 'eolica', 'Santa Cruz', 10, 2018],
    [-38.74, -62.27, 'Parque Eólico Corti', 'eolica', 'Buenos Aires', 100, 2018],

    // Solares (☀️)
    [-31.53, -68.53, 'Planta Solar Ullum', 'solar', 'San Juan', 20, 2018],
    [-29.28, -67.14, 'Planta Solar Nonogasta', 'solar', 'La Rioja', 35, 2019],
    [-23.95, -66.52, 'Cauchari Solar', 'solar', 'Jujuy', 300, 2020],

    // Hidroeléctricas (💧)
    [-27.48, -56.65, 'Yacyretá', 'hidro', 'Corrientes/Misiones', 3200, 1994],
    [-31.25, -57.92, 'Salto Grande', 'hidro', 'Entre Ríos', 1890, 1979],
    
    // Nucleares (⚛️)
    [-34.10, -58.75, 'Atucha I', 'nuclear', 'Buenos Aires', 362, 1974],
    [-34.10, -58.75, 'Atucha II', 'nuclear', 'Buenos Aires', 745, 2014],
    [-32.12, -64.40, 'Embalse', 'nuclear', 'Córdoba', 648, 1983],
    
    // Biomasa (🌱)
    [-33.98, -60.20, 'Planta Biomasa Timbúes', 'biomasa', 'Santa Fe', 12, 2021],
    [-31.75, -63.70, 'Planta Biomasa Río Cuarto', 'biomasa', 'Córdoba', 8, 2022],
    [-34.70, -58.00, 'Planta Biomasa Berazategui', 'biomasa', 'Buenos Aires', 15, 2023],
];

// Mapeo de tipos de energía a colores y emojis para los iconos
const tipoEstilo = {
    'eolica': { color: 'blue', emoji: '🌀' },
    'solar': { color: 'orange', emoji: '☀️' },
    'hidro': { color: 'cyan', emoji: '💧' },
    'nuclear': { color: 'red', emoji: '⚛️' },
    'biomasa': { color: 'green', emoji: '🌱' },
};


// ===============================================
// 2. Inicialización del Mapa Leaflet
// ===============================================

// Establecer el centro del mapa en Argentina (~Cordoba) y un nivel de zoom inicial
const map = L.map('map').setView([-34, -64], 5); 

// Cargar la capa base (Tiles) de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Grupo para almacenar todos los marcadores y poder manipularlos fácilmente
const markersLayer = L.layerGroup().addTo(map);

// ===============================================
// 3. Funciones de Marcadores y Popups
// ===============================================

/**
 * Crea un icono personalizado para cada tipo de central.
 * @param {string} tipo - El tipo de energía (eolica, solar, etc.).
 * @returns {L.DivIcon} Un objeto de icono Leaflet.
 */
function createCustomIcon(tipo) {
    const style = tipoEstilo[tipo] || { color: 'black', emoji: '❓' };
    
    // Usa un DivIcon para poner el emoji y darle estilo CSS
    return L.divIcon({
        className: 'custom-icon', // Puedes darle más estilos en style.css
        html: `<div style="color:${style.color}; font-size: 24px;">${style.emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
}

/**
 * Genera el contenido HTML para la ficha informativa (Popup).
 * @param {Array} data - El array de datos de la central.
 * @returns {string} El HTML del popup.
 */
function createPopupContent(data) {
    const [lat, lon, nombre, tipo, provincia, potencia, anio] = data;
    const emoji = tipoEstilo[tipo].emoji;
    
    return `
        <h3>${emoji} ${nombre}</h3>
        <p><strong>Tipo:</strong> ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
        <p><strong>Provincia:</strong> ${provincia}</p>
        <p><strong>Potencia Instalada:</strong> ${potencia} MW</p>
        <p><strong>Año de Inauguración:</strong> ${anio}</p>
        <p><em>Coordenadas: ${lat.toFixed(2)}, ${lon.toFixed(2)}</em></p>
    `;
}

/**
 * Agrega todos los marcadores al mapa.
 * @param {Array} data - Array con los datos de todas las centrales.
 */
function addAllMarkers(data) {
    data.forEach(central => {
        const [lat, lon, nombre, tipo] = central;
        
        // 1. Crea el icono personalizado
        const customIcon = createCustomIcon(tipo);

        // 2. Crea el marcador
        const marker = L.marker([lat, lon], {
            icon: customIcon,
            tipo: tipo // Almacenar el tipo en el marcador para el filtrado
        });
        
        // 3. Asigna la ficha informativa (Popup)
        marker.bindPopup(createPopupContent(central));
        
        // 4. Agrega al grupo de capas
        markersLayer.addLayer(marker);
    });
}


// ===============================================
// 4. Función de Filtrado (Interactividad)
// ===============================================

/**
 * Filtra los marcadores visibles en el mapa basándose en los checkboxes.
 */
function filterMarkers() {
    // Obtiene el estado de cada checkbox
    const filtrosActivos = {
        'eolica': document.getElementById('filtro-eolica').checked,
        'solar': document.getElementById('filtro-solar').checked,
        'hidro': document.getElementById('filtro-hidro').checked,
        'nuclear': document.getElementById('filtro-nuclear').checked,
        'biomasa': document.getElementById('filtro-biomasa').checked
    };

    // Itera sobre todos los marcadores en el grupo
    markersLayer.eachLayer(function(layer) {
        // 'tipo' es una propiedad que añadimos al crear el marcador
        const tipoCentral = layer.options.tipo; 
        
        if (filtrosActivos[tipoCentral]) {
            // Si el filtro para este tipo está activo, mostrar (añadir al mapa)
            if (!map.hasLayer(layer)) {
                map.addLayer(layer);
            }
        } else {
            // Si el filtro no está activo, ocultar (remover del mapa)
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        }
    });
}


// ===============================================
// 5. Ejecución e Inicialización
// ===============================================

// 1. Agrega los marcadores la primera vez
addAllMarkers(centralesData);

// 2. Configura los listeners para los filtros
document.querySelectorAll('#filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', filterMarkers);
});

// Nota: Puedes agregar aquí el código para centrar el mapa a la extensión de los marcadores si quieres.
// const bounds = markersLayer.getBounds();
// map.fitBounds(bounds);
