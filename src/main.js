import './style.css';
import mapboxgl from 'mapbox-gl';

// Cargar token desde las variables de entorno de Vite (.env)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Inicializar el mapa
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Estilo de satélite con calles
    center: [-3.703790, 40.416775], // Centro en Madrid por defecto
    zoom: 5,
    pitch: 0, // Inclinación inicial
    bearing: 0 // Rotación inicial
});

// Controles de navegación (zoom, rotación)
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// Variable para el marcador
let currentMarker = null;

// Referencias a elementos del DOM
const infoPanel = document.getElementById('info');

// Añadir terreno 3D cuando el estilo cargue
map.on('style.load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });

    // Configurar la exageración del terreno para que el relieve se note más
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

    // Añadir capa de cielo para mejorar el aspecto 3D
    map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
        }
    });
});

// Evento al hacer clic en el mapa
map.on('click', (e) => {
    const coordinates = e.lngLat;
    const lng = coordinates.lng.toFixed(5);
    const lat = coordinates.lat.toFixed(5);

    // Si ya hay un marcador, removerlo
    if (currentMarker) {
        currentMarker.remove();
    }

    // Crear un nuevo marcador y añadirlo al mapa
    currentMarker = new mapboxgl.Marker({ color: '#38bdf8' })
        .setLngLat(coordinates)
        .addTo(map);

    // Animar la cámara: hacer zoom, inclinar (pitch) y rotar (bearing)
    // para mostrar el relieve en 3D
    map.flyTo({
        center: coordinates,
        zoom: 13, // Zoom más cercano para ver relieve
        pitch: 65, // Inclinación para vista 3D
        bearing: Math.random() * 90 - 45, // Rotación aleatoria para dinamismo
        duration: 2500, // Duración de la animación en ms
        essential: true
    });

    // Actualizar el panel de información
    updateInfoPanel(lng, lat);
});

// Cambiar cursor al pasar sobre el mapa
map.on('mouseenter', 'places', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'places', () => {
    map.getCanvas().style.cursor = '';
});

// Función para actualizar el panel de información
function updateInfoPanel(lng, lat) {
    infoPanel.innerHTML = `
        <h3>Punto Seleccionado</h3>
        <div class="coordinate-box">
            <div class="coord-row">
                <span class="coord-label">Longitud</span>
                <span class="coord-value">${lng}°</span>
            </div>
            <div class="coord-row">
                <span class="coord-label">Latitud</span>
                <span class="coord-value">${lat}°</span>
            </div>
        </div>
        <p style="margin-top: 15px; font-size: 0.85rem; color: #94a3b8;">
            Explorando relieve en 3D. Usa el ratón (click derecho + arrastrar) para cambiar el ángulo.
        </p>
    `;
}
