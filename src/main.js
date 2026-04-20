import './style.css';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// Fetch token from .env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Default to Madrid initially
const defaultCenter = [-3.703790, 40.416775];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: defaultCenter, 
    zoom: 5,
    pitch: 0,
    bearing: 0
});

// Map controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// Wait for style load
map.on('style.load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
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

// Setup Geocoder
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Buscar ubicación o introducir Lat, Lon...',
    marker: false
});
document.getElementById('geocoder-container').appendChild(geocoder.onAdd(map));

let currentMarker = null;

// UI Elements
const tooltip = document.getElementById('map-tooltip');
const headerCoords = document.getElementById('header-coords');
const coordsInput = document.getElementById('coords-input');
const dateInput = document.getElementById('date-input');
const panel = document.getElementById('prediction-panel');
const closeBtn = document.getElementById('close-panel-btn');
const tabRiesgo = document.getElementById('tab-riesgo');
const tabFrp = document.getElementById('tab-frp');
const resultsContainer = document.getElementById('results-container');
const actionBtn = document.getElementById('action-btn');

// Set today's date implicitly and restrict past dates
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const formattedToday = `${year}-${month}-${day}`;

dateInput.value = formattedToday;
dateInput.min = formattedToday;

let activeTab = 'riesgo'; // 'riesgo' or 'frp'
let hasPrediction = false;

// Handle map clicks
map.on('click', (e) => {
    tooltip.style.opacity = '0'; // Hide tooltip on first click
    panel.style.display = 'flex'; // Ensure panel is open
    setCoordinates(e.lngLat.lng, e.lngLat.lat);
    
    map.flyTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: 14,
        pitch: 65,
        duration: 1500, // Smooth transition duration
        essential: true
    });
});

// Handle geocoder result
geocoder.on('result', (e) => {
    tooltip.style.opacity = '0';
    panel.style.display = 'flex';
    setCoordinates(e.result.center[0], e.result.center[1]);
});

// Set coordinates function
function setCoordinates(lng, lat) {
    const formatLng = lng.toFixed(4);
    const formatLat = lat.toFixed(4);
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latDir = lat >= 0 ? 'N' : 'S';
    
    const coordString = `${Math.abs(formatLat)}° ${latDir}, ${Math.abs(formatLng)}° ${lngDir}`;
    
    headerCoords.textContent = coordString;
    coordsInput.value = coordString;

    if (currentMarker) currentMarker.remove();
    currentMarker = new mapboxgl.Marker({ color: '#3182ce' })
        .setLngLat([lng, lat])
        .addTo(map);

    // Reset prediction state when a new point is selected
    hasPrediction = false;
    updateUIState();
}

// Interactivity
closeBtn.addEventListener('click', () => {
    panel.style.display = 'none';
});

tabRiesgo.addEventListener('click', () => {
    activeTab = 'riesgo';
    tabRiesgo.classList.add('active');
    tabFrp.classList.remove('active');
    if (hasPrediction) generateMockPrediction();
});

tabFrp.addEventListener('click', () => {
    activeTab = 'frp';
    tabFrp.classList.add('active');
    tabRiesgo.classList.remove('active');
    if (hasPrediction) generateMockPrediction();
});

actionBtn.addEventListener('click', () => {
    if(!coordsInput.value) {
        alert("Por favor, selecciona una ubicación en el mapa primero.");
        return;
    }
    hasPrediction = true;
    updateUIState();
    generateMockPrediction();
});

function updateUIState() {
    if (hasPrediction) {
        actionBtn.textContent = 'Recalcular predicción';
        actionBtn.classList.add('outline-btn');
        actionBtn.classList.remove('primary-btn');
    } else {
        resultsContainer.innerHTML = '';
        actionBtn.textContent = 'Generar predicción';
        actionBtn.classList.remove('outline-btn');
        actionBtn.classList.add('primary-btn');
    }
}

function generateMockPrediction() {
    if (activeTab === 'riesgo') {
        resultsContainer.innerHTML = `
            <div class="result-section">
                <div class="result-header">Resultado de la Predicción</div>
                <div class="risk-probability">PROBABILIDAD DE INCENDIO: 95%</div>
                
                <div class="factors-title">Principales Factores Determinantes (Impacto)</div>
                
                <div class="factor-item">
                    <div class="factor-header">
                        <span class="factor-icon">🌡️</span> Alta Temperatura (34ºC)
                    </div>
                    <div class="progress-bg"><div class="progress-bar pb-red"></div></div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-header">
                        <span class="factor-icon">💧</span> Baja Humedad (18%)
                    </div>
                    <div class="progress-bg"><div class="progress-bar pb-orange"></div></div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-header">
                        <span class="factor-icon">💨</span> Viento Moderado (20 km/h)
                    </div>
                    <div class="progress-bg"><div class="progress-bar pb-yellow"></div></div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-header">
                        <span class="factor-icon">🌿</span> Sequedad de la Vegetación (Extrema)
                    </div>
                    <div class="progress-bg"><div class="progress-bar pb-extreme"></div></div>
                </div>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = `
            <div class="result-section">
                <div class="result-header">Resultado de la Predicción de FRP</div>
                <div class="frp-title">FRP ESTIMADO:</div>
                <div class="frp-value">87.3 MW</div>
                <div class="frp-subtitle">Potencia Radiativa del Fuego Estimada</div>
            </div>
        `;
    }
}

// Current Location Button
document.getElementById('target-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lng = position.coords.longitude;
                const lat = position.coords.latitude;
                map.flyTo({ center: [lng, lat], zoom: 12 });
                setCoordinates(lng, lat);
                panel.style.display = 'flex';
            },
            () => {
                alert("No se pudo obtener la ubicación actual.");
            }
        );
    }
});
