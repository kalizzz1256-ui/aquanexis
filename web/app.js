// AQUANEXIS - GIS-Based Watershed Development Decision Support System
// Client-side Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initGISMap();
  initLocationPicker();
  initHydrologySimulator();
  initSolarEnergyCalculator();
  initSplitPhotoSlider();
  initDPRModal();
  initMonitoringCharts();
  initInterventionProgressBars();
});

/* =========================================================================
   1. NAVIGATION & TAB SWITCHING
   ========================================================================= */
function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const stepNodes = document.querySelectorAll('.step-node');
  const flowchartToggleBtn = document.getElementById('btn-toggle-flowchart-view');

  function activateTab(targetTab) {
    tabButtons.forEach(b => {
      if (b.dataset.tab === targetTab) b.classList.add('active');
      else b.classList.remove('active');
    });

    tabPanels.forEach(p => {
      if (p.id === targetTab) p.classList.add('active');
      else p.classList.remove('active');
    });

    // Sync top pipeline stepper
    stepNodes.forEach(node => {
      if (node.dataset.target === targetTab) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    if (targetTab === 'gis-studio' && window.watershedMap) {
      setTimeout(() => window.watershedMap.invalidateSize(), 200);
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
    });
  });

  // Step Node clicks in the flowchart stepper bar
  stepNodes.forEach(node => {
    node.addEventListener('click', () => {
      const target = node.dataset.target;
      activateTab(target);
    });
  });

  // Header Flowchart View button
  if (flowchartToggleBtn) {
    flowchartToggleBtn.addEventListener('click', () => {
      activateTab('flowchart-view');
    });
  }

  populateWatershedSelect();
  const watershedSelect = document.getElementById('watershed-select');
  if (watershedSelect) {
    watershedSelect.addEventListener('change', (e) => {
      const key = e.target.value;
      if (WATERSHED_DB[key]) loadWatershedData(key);
    });
  }

  // Live global dam search (debounced)
  const wsSearch = document.getElementById('watershed-search-input');
  if (wsSearch) {
    let _searchTimer = null;
    wsSearch.addEventListener('input', (e) => {
      const term = e.target.value.trim();
      clearTimeout(_searchTimer);
      if (term.length < 2) {
        filterWatershedOptions(term.toLowerCase());
        return;
      }
      _searchTimer = setTimeout(() => searchGlobalDams(term), 400);
    });
    wsSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const sel = document.getElementById('watershed-select');
        if (sel && sel.value) {
          if (WATERSHED_DB[sel.value]) loadWatershedData(sel.value);
          else if (window._osmDamCache && window._osmDamCache[sel.value]) {
            loadOsmDam(window._osmDamCache[sel.value]);
          }
        }
      }
    });
  }
}

/* =========================================================================
   2. WATERSHED DATA DEFINITIONS
   ========================================================================= */
const WATERSHED_DB = {

  /* ── Micro-Watersheds ── */
  kalleshwara: {
    name: "Kalleshwara Micro-Watershed", label: "Kalleshwara Micro-Watershed (KA-0104)",
    group: "Micro-Watersheds",
    id: "WS-KA-DVG-0104", center: [11.0345, 76.0412],
    area_ha: 482.5, rainfall_mm: 845, avg_slope: 5.8, soil_group: "B", curve_number: 74,
    boundary: [[11.052,76.021],[11.060,76.048],[11.045,76.068],[11.025,76.055],[11.018,76.030],[11.032,76.015],[11.052,76.021]],
    streams: [
      { order: 3, coords: [[11.055,76.035],[11.045,76.040],[11.035,76.042],[11.024,76.047]] },
      { order: 2, coords: [[11.058,76.046],[11.048,76.043],[11.035,76.042]] },
      { order: 2, coords: [[11.030,76.022],[11.033,76.032],[11.035,76.042]] },
      { order: 1, coords: [[11.059,76.025],[11.055,76.035]] },
      { order: 1, coords: [[11.040,76.060],[11.048,76.043]] }
    ],
    interventions: [
      { id:"INT-01", type:"Continuous Contour Trench",    zone:"Ridge",       order:1, coords:[11.057,76.027], capacity:2400, cost:120000,  recharge:7200,  status:"Proposed"  },
      { id:"INT-02", type:"Loose Boulder Gully Plug",     zone:"Mid-Slope",   order:1, coords:[11.054,76.034], capacity:650,  cost:45000,   recharge:1950,  status:"Proposed"  },
      { id:"INT-03", type:"Gabion Check Dam",             zone:"Mid-Slope",   order:2, coords:[11.044,76.042], capacity:1600, cost:165000,  recharge:4800,  status:"Ongoing"   },
      { id:"INT-04", type:"Masonry Check Dam",            zone:"Valley Floor",order:3, coords:[11.0345,76.0412], capacity:5200, cost:420000, recharge:15600, status:"Completed" },
      { id:"INT-05", type:"Earthen Percolation Tank",     zone:"Valley Floor",order:3, coords:[11.026,76.046], capacity:9800, cost:680000,  recharge:29400, status:"Proposed"  },
      { id:"INT-06", type:"Community Farm Pond",          zone:"Mid-Slope",   order:2, coords:[11.031,76.028], capacity:3500, cost:210000,  recharge:10500, status:"Proposed"  }
    ]
  },

  wardha: {
    name: "Wardha River Catchment Sub-4", label: "Wardha Catchment Sub-4 (MH-0042)",
    group: "Micro-Watersheds",
    id: "WS-MH-WRD-0042", center: [20.7453, 78.6022],
    area_ha: 620.0, rainfall_mm: 960, avg_slope: 7.2, soil_group: "C", curve_number: 82,
    boundary: [[20.760,78.585],[20.770,78.610],[20.755,78.630],[20.730,78.615],[20.725,78.590],[20.760,78.585]],
    streams: [
      { order: 3, coords: [[20.765,78.600],[20.750,78.605],[20.735,78.610]] },
      { order: 2, coords: [[20.768,78.618],[20.755,78.610],[20.750,78.605]] },
      { order: 1, coords: [[20.740,78.588],[20.750,78.605]] }
    ],
    interventions: [
      { id:"INT-W1", type:"Continuous Contour Trench", zone:"Ridge",       order:1, coords:[20.765,78.592], capacity:3100, cost:155000, recharge:9300,  status:"Proposed" },
      { id:"INT-W2", type:"Gabion Check Dam",          zone:"Mid-Slope",   order:2, coords:[20.756,78.612], capacity:2200, cost:210000, recharge:6600,  status:"Proposed" },
      { id:"INT-W3", type:"Masonry Check Dam",         zone:"Valley Floor",order:3, coords:[20.745,78.604], capacity:6400, cost:490000, recharge:19200, status:"Ongoing"  }
    ]
  },

  /* ── Major Dam Catchments ── */
  krs_dam: {
    name: "KRS Dam — Cauvery Reservoir", label: "KRS Dam – Krishnarajasagara (KA)",
    group: "Major Dam Catchments",
    id: "DAM-KA-MYS-KRS", center: [12.424, 76.572],
    area_ha: 13800, rainfall_mm: 758, avg_slope: 3.2, soil_group: "B", curve_number: 71,
    boundary: [[12.445,76.550],[12.455,76.590],[12.435,76.605],[12.410,76.592],[12.400,76.558],[12.425,76.545],[12.445,76.550]],
    streams: [
      { order: 3, coords: [[12.450,76.560],[12.435,76.572],[12.424,76.572],[12.408,76.580]] },
      { order: 2, coords: [[12.450,76.590],[12.438,76.580],[12.424,76.572]] },
      { order: 1, coords: [[12.415,76.550],[12.424,76.572]] }
    ],
    interventions: [
      { id:"KRS-01", type:"Reservoir Dam",            zone:"Valley Floor", order:3, coords:[12.424,76.572], capacity:4945000, cost:0,       recharge:148350000, status:"Completed" },
      { id:"KRS-02", type:"Gabion Check Dam",          zone:"Mid-Slope",   order:2, coords:[12.440,76.565], capacity:3200,    cost:220000,  recharge:9600,      status:"Proposed"  },
      { id:"KRS-03", type:"Percolation Tank",          zone:"Valley Floor", order:3, coords:[12.412,76.585], capacity:12000,   cost:850000,  recharge:36000,     status:"Ongoing"   },
      { id:"KRS-04", type:"Continuous Contour Trench", zone:"Ridge",       order:1, coords:[12.448,76.558], capacity:2800,    cost:140000,  recharge:8400,      status:"Proposed"  }
    ]
  },

  amaravathy_dam: {
    name: "Amaravathy Dam Catchment", label: "Amaravathy Dam (TN-0031) — 3 TMC",
    group: "Major Dam Catchments",
    id: "DAM-TN-KRR-AMV", center: [10.418, 77.118],
    area_ha: 931, rainfall_mm: 920, avg_slope: 6.4, soil_group: "B", curve_number: 74,
    boundary: [[10.435,77.095],[10.442,77.130],[10.422,77.148],[10.400,77.135],[10.392,77.105],[10.415,77.090],[10.435,77.095]],
    streams: [
      { order: 3, coords: [[10.438,77.105],[10.425,77.115],[10.418,77.118],[10.405,77.128]] },
      { order: 2, coords: [[10.440,77.128],[10.430,77.120],[10.418,77.118]] },
      { order: 1, coords: [[10.408,77.097],[10.418,77.118]] }
    ],
    interventions: [
      { id:"AMV-01", type:"Reservoir Dam",            zone:"Valley Floor", order:3, coords:[10.418,77.118], capacity:300000, cost:0,       recharge:9000000, status:"Completed" },
      { id:"AMV-02", type:"Gabion Check Dam",          zone:"Mid-Slope",   order:2, coords:[10.432,77.108], capacity:1800,   cost:175000,  recharge:5400,    status:"Proposed"  },
      { id:"AMV-03", type:"Continuous Contour Trench", zone:"Ridge",       order:1, coords:[10.440,77.100], capacity:2200,   cost:110000,  recharge:6600,    status:"Proposed"  },
      { id:"AMV-04", type:"Percolation Tank",          zone:"Valley Floor", order:3, coords:[10.408,77.130], capacity:8500,   cost:590000,  recharge:25500,   status:"Ongoing"   }
    ]
  },

  bhavani_sagar: {
    name: "Bhavani Sagar Dam Catchment", label: "Bhavani Sagar Dam (TN-ERO) — 32.8 TMC",
    group: "Major Dam Catchments",
    id: "DAM-TN-ERO-BVS", center: [11.472, 77.185],
    area_ha: 18500, rainfall_mm: 880, avg_slope: 5.1, soil_group: "B", curve_number: 72,
    boundary: [[11.495,77.158],[11.510,77.200],[11.480,77.220],[11.450,77.205],[11.440,77.168],[11.468,77.152],[11.495,77.158]],
    streams: [
      { order: 3, coords: [[11.505,77.172],[11.488,77.182],[11.472,77.185],[11.455,77.195]] },
      { order: 2, coords: [[11.508,77.198],[11.492,77.188],[11.472,77.185]] },
      { order: 1, coords: [[11.458,77.160],[11.472,77.185]] }
    ],
    interventions: [
      { id:"BVS-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[11.472,77.185], capacity:3280000, cost:0,       recharge:98400000, status:"Completed" },
      { id:"BVS-02", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[11.490,77.175], capacity:2600,    cost:240000,  recharge:7800,     status:"Ongoing"   },
      { id:"BVS-03", type:"Loose Boulder Gully Plug",  zone:"Ridge",       order:1, coords:[11.504,77.165], capacity:800,     cost:52000,   recharge:2400,     status:"Proposed"  },
      { id:"BVS-04", type:"Earthen Percolation Tank",  zone:"Valley Floor", order:3, coords:[11.455,77.198], capacity:11000,   cost:760000,  recharge:33000,    status:"Proposed"  }
    ]
  },

  /* ── River Corridors ── */
  noyal_river: {
    name: "Noyal River Corridor", label: "Noyal River (TN — Coimbatore/Tiruppur)",
    group: "River Corridors",
    id: "RIV-TN-CBE-NOY", center: [10.995, 77.385],
    area_ha: 740, rainfall_mm: 680, avg_slope: 4.2, soil_group: "C", curve_number: 83,
    boundary: [[11.020,77.340],[11.040,77.385],[11.018,77.430],[10.975,77.415],[10.962,77.370],[10.990,77.338],[11.020,77.340]],
    streams: [
      { order: 3, coords: [[11.028,77.350],[11.008,77.375],[10.995,77.385],[10.978,77.405]] },
      { order: 2, coords: [[11.032,77.378],[11.015,77.382],[10.995,77.385]] },
      { order: 1, coords: [[10.982,77.352],[10.995,77.385]] }
    ],
    interventions: [
      { id:"NOY-01", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[10.995,77.385], capacity:7200, cost:520000,  recharge:21600, status:"Proposed"  },
      { id:"NOY-02", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[11.012,77.370], capacity:1900, cost:185000,  recharge:5700,  status:"Ongoing"   },
      { id:"NOY-03", type:"Continuous Contour Trench", zone:"Ridge",       order:1, coords:[11.030,77.355], capacity:1500, cost:75000,   recharge:4500,  status:"Proposed"  },
      { id:"NOY-04", type:"Loose Boulder Gully Plug",  zone:"Mid-Slope",   order:2, coords:[11.005,77.395], capacity:550,  cost:38000,   recharge:1650,  status:"Proposed"  },
      { id:"NOY-05", type:"Community Farm Pond",       zone:"Valley Floor", order:3, coords:[10.980,77.408], capacity:5400, cost:375000,  recharge:16200, status:"Proposed"  }
    ]
  },

  cauvery_upper: {
    name: "Upper Cauvery Sub-Catchment", label: "Upper Cauvery (Coorg–Mysuru corridor)",
    group: "River Corridors",
    id: "RIV-KA-COG-CAV", center: [12.328, 75.912],
    area_ha: 22400, rainfall_mm: 1420, avg_slope: 8.6, soil_group: "A", curve_number: 64,
    boundary: [[12.360,75.870],[12.385,75.940],[12.352,75.968],[12.302,75.948],[12.288,75.888],[12.320,75.862],[12.360,75.870]],
    streams: [
      { order: 3, coords: [[12.372,75.885],[12.345,75.912],[12.328,75.912],[12.308,75.938]] },
      { order: 2, coords: [[12.375,75.932],[12.355,75.920],[12.328,75.912]] },
      { order: 1, coords: [[12.312,75.875],[12.328,75.912]] }
    ],
    interventions: [
      { id:"CAV-01", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[12.328,75.912], capacity:15000, cost:1050000, recharge:45000, status:"Proposed"  },
      { id:"CAV-02", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[12.348,75.900], capacity:3800,  cost:310000,  recharge:11400, status:"Proposed"  },
      { id:"CAV-03", type:"Continuous Contour Trench", zone:"Ridge",       order:1, coords:[12.368,75.882], capacity:4200,  cost:210000,  recharge:12600, status:"Ongoing"   }
    ]
  },

  /* ── Custom / User-Defined ── */
  custom_site: {
    name: "Custom Selected Site", label: "📍 Custom Map Selection",
    group: "Custom",
    id: "CUSTOM", center: [11.0345, 76.0412],
    area_ha: 0, rainfall_mm: 0, avg_slope: 0, soil_group: "B", curve_number: 74,
    boundary: [[11.042,76.031],[11.050,76.051],[11.035,76.062],[11.020,76.050],[11.018,76.028],[11.033,76.022],[11.042,76.031]],
    streams: [{ order: 2, coords: [[11.046,76.040],[11.035,76.042],[11.022,76.048]] }],
    interventions: []
  }
};

let currentWatershedKey = 'kalleshwara';
let mapLayers = {
  boundary: null,
  streams: [],
  markers: []
};

/* =========================================================================
   3. GIS INTERACTIVE MAP
   ========================================================================= */
function initGISMap() {
  const mapElement = document.getElementById('watershed-map');
  if (!mapElement) return;

  const currentWS = WATERSHED_DB[currentWatershedKey];
  const map = L.map('watershed-map', {
    zoomControl: true,
    attributionControl: false
  }).setView(currentWS.center, 14);

  window.watershedMap = map;

  // Base Layers
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  });

  const cartoDarkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  });

  // Default to Satellite for rich remote sensing feel
  satelliteLayer.addTo(map);

  // Layer Switchers in UI
  const tileSelect = document.getElementById('base-map-select');
  if (tileSelect) {
    tileSelect.addEventListener('change', (e) => {
      map.removeLayer(osmLayer);
      map.removeLayer(satelliteLayer);
      map.removeLayer(cartoDarkLayer);

      if (e.target.value === 'satellite') satelliteLayer.addTo(map);
      else if (e.target.value === 'carto') cartoDarkLayer.addTo(map);
      else osmLayer.addTo(map);
    });
  }

  // Initial draw
  drawWatershedFeatures(currentWS);

  // Setup Layer Toggles
  setupLayerToggles();

  // Setup Filter Chips
  setupFilterChips();

  // Map click → find nearest local watershed & select it
  map.on('click', function(e) {
    const clicked = [e.latlng.lat, e.latlng.lng];
    selectWatershedOnMap(clicked);
  });

  // Load dams in view whenever map is moved or zoomed
  map.on('moveend', function() {
    loadDamsInView();
  });

  // Initial load of global dams in current view
  setTimeout(loadDamsInView, 800);
}

/* -------------------------------------------------------------------------
   WATERSHED SELECT HELPERS
   ------------------------------------------------------------------------- */

/**
 * Build grouped <optgroup> options inside #watershed-select from WATERSHED_DB.
 * Called once on page load. OSM results are appended dynamically.
 */
function populateWatershedSelect() {
  const sel = document.getElementById('watershed-select');
  if (!sel) return;

  // Gather groups
  const groups = {};
  Object.entries(WATERSHED_DB).forEach(([key, ws]) => {
    const g = ws.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push({ key, label: ws.label || ws.name });
  });

  sel.innerHTML = '';
  Object.entries(groups).forEach(([groupName, items]) => {
    const og = document.createElement('optgroup');
    og.label = groupName;
    items.forEach(({ key, label }) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = label;
      if (key === currentWatershedKey) opt.selected = true;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

/**
 * Filter the select dropdown options by a search term.
 * Hides optgroups that have no visible options.
 */
function filterWatershedOptions(term) {
  const sel = document.getElementById('watershed-select');
  if (!sel) return;
  Array.from(sel.querySelectorAll('optgroup')).forEach(og => {
    let hasVisible = false;
    Array.from(og.querySelectorAll('option')).forEach(opt => {
      const match = !term || opt.textContent.toLowerCase().includes(term);
      opt.style.display = match ? '' : 'none';
      if (match) hasVisible = true;
    });
    og.style.display = hasVisible ? '' : 'none';
  });
}

/**
 * Given a clicked [lat, lng] on the map, find the nearest watershed centre
 * (excluding the custom_site placeholder) and select it in the dropdown.
 * Shows a brief toast notification.
 */
function selectWatershedOnMap(latlng) {
  let bestKey = null;
  let bestDist = Infinity;

  Object.entries(WATERSHED_DB).forEach(([key, ws]) => {
    if (key === 'custom_site') return;
    const dlat = ws.center[0] - latlng[0];
    const dlng = ws.center[1] - latlng[1];
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  });

  if (!bestKey) return;

  const sel = document.getElementById('watershed-select');
  if (sel) sel.value = bestKey;
  loadWatershedData(bestKey);

  // Toast notification
  showMapToast('📍 Watershed selected: ' + WATERSHED_DB[bestKey].name);
}

/**
 * Brief overlay toast shown on top of the map.
 */
function showMapToast(msg) {
  let toast = document.getElementById('map-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'map-toast';
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(5,150,105,0.95)', 'color:#fff', 'padding:.55rem 1.2rem',
      'border-radius:30px', 'font-size:.82rem', 'font-weight:600',
      'font-family:Segoe UI,sans-serif', 'box-shadow:0 4px 20px rgba(0,0,0,.25)',
      'z-index:9999', 'pointer-events:none', 'transition:opacity .4s'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}

function drawWatershedFeatures(data) {
  const map = window.watershedMap;
  if (!map) return;

  // Clear existing layers
  if (mapLayers.boundary) map.removeLayer(mapLayers.boundary);
  mapLayers.streams.forEach(s => map.removeLayer(s));
  mapLayers.markers.forEach(m => map.removeLayer(m));
  mapLayers.streams = [];
  mapLayers.markers = [];

  // 1. Boundary Polygon
  mapLayers.boundary = L.polygon(data.boundary, {
    color: '#10b981',
    weight: 2.5,
    dashArray: '6, 6',
    fillColor: '#10b981',
    fillOpacity: 0.12
  }).addTo(map);

  mapLayers.boundary.bindPopup(`
    <div style="font-weight:600; color:#34d399; margin-bottom:4px;">${data.name}</div>
    <div><strong>ID:</strong> ${data.id}</div>
    <div><strong>Total Area:</strong> ${data.area_ha} Hectares</div>
    <div><strong>Annual Rainfall:</strong> ${data.rainfall_mm} mm</div>
    <div><strong>Hydrologic Soil Group:</strong> Group ${data.soil_group}</div>
  `);

  // 2. Streams (Hydrological Drainage)
  data.streams.forEach(stream => {
    let strokeColor = '#38bdf8';
    let strokeWidth = 2.5;

    if (stream.order === 3) {
      strokeColor = '#0284c7';
      strokeWidth = 4.5;
    } else if (stream.order === 2) {
      strokeColor = '#38bdf8';
      strokeWidth = 3;
    } else {
      strokeColor = '#7dd3fc';
      strokeWidth = 1.8;
    }

    const poly = L.polyline(stream.coords, {
      color: strokeColor,
      weight: strokeWidth,
      opacity: 0.9
    }).addTo(map);

    poly.bindPopup(`
      <strong>Drainage Stream Segment</strong><br/>
      Strahler Stream Order: <strong>Order ${stream.order}</strong><br/>
      Classification: ${stream.order === 3 ? 'Valley Main Stream' : (stream.order === 2 ? 'Sub-Catchment Tributary' : 'Ridge Gully Runoff Line')}
    `);
    mapLayers.streams.push(poly);
  });

  // 3. Intervention Structural Markers
  data.interventions.forEach(item => {
    let markerColor = '#10b981';
    let iconLetter = 'CD';

    if (item.zone === 'Ridge') {
      markerColor = '#f59e0b';
      iconLetter = 'CT';
    } else if (item.zone === 'Mid-Slope') {
      markerColor = '#38bdf8';
      iconLetter = 'GB';
    }

    const customIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="
          background: ${markerColor};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${markerColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          font-family: sans-serif;
          cursor: pointer;
        ">${iconLetter}</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker(item.coords, { icon: customIcon }).addTo(map);
    marker.interventionData = item;

    marker.bindPopup(`
      <div style="font-weight:700; font-size:13px; color:#ffffff; margin-bottom:4px;">${item.type}</div>
      <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">ID: ${item.id} | Zone: ${item.zone}</div>
      <table style="width:100%; font-size:11px; line-height:1.4;">
        <tr><td><strong>Storage Capacity:</strong></td><td align="right">${item.capacity.toLocaleString()} m³</td></tr>
        <tr><td><strong>Annual Recharge:</strong></td><td align="right">${item.recharge.toLocaleString()} m³</td></tr>
        <tr><td><strong>Estimated Cost:</strong></td><td align="right">₹${item.cost.toLocaleString()}</td></tr>
        <tr><td><strong>Current Stage:</strong></td><td align="right"><span style="color:#34d399; font-weight:600;">${item.status}</span></td></tr>
      </table>
    `);

    mapLayers.markers.push(marker);
  });

  map.fitBounds(mapLayers.boundary.getBounds(), { padding: [30, 30] });
  renderInterventionsTable(data.interventions);
}

function setupLayerToggles() {
  const toggleBoundary = document.getElementById('toggle-boundary');
  const toggleStreams = document.getElementById('toggle-streams');
  const toggleStructures = document.getElementById('toggle-structures');

  if (toggleBoundary) {
    toggleBoundary.addEventListener('change', (e) => {
      if (!window.watershedMap || !mapLayers.boundary) return;
      if (e.target.checked) window.watershedMap.addLayer(mapLayers.boundary);
      else window.watershedMap.removeLayer(mapLayers.boundary);
    });
  }

  if (toggleStreams) {
    toggleStreams.addEventListener('change', (e) => {
      if (!window.watershedMap) return;
      mapLayers.streams.forEach(s => {
        if (e.target.checked) window.watershedMap.addLayer(s);
        else window.watershedMap.removeLayer(s);
      });
    });
  }

  if (toggleStructures) {
    toggleStructures.addEventListener('change', (e) => {
      if (!window.watershedMap) return;
      mapLayers.markers.forEach(m => {
        if (e.target.checked) window.watershedMap.addLayer(m);
        else window.watershedMap.removeLayer(m);
      });
    });
  }
}

function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;

      mapLayers.markers.forEach(m => {
        const item = m.interventionData;
        if (!item) return;

        if (filter === 'all' || item.zone.toLowerCase().includes(filter)) {
          if (!window.watershedMap.hasLayer(m)) window.watershedMap.addLayer(m);
        } else {
          if (window.watershedMap.hasLayer(m)) window.watershedMap.removeLayer(m);
        }
      });
    });
  });
}

function renderInterventionsTable(items) {
  const tbody = document.getElementById('interventions-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  items.forEach(item => {
    let badgeClass = 'badge-valley';
    if (item.zone === 'Ridge') badgeClass = 'badge-ridge';
    else if (item.zone === 'Mid-Slope') badgeClass = 'badge-mid';

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td><strong>${item.id}</strong></td>
      <td><strong>${item.type}</strong></td>
      <td><span class="badge ${badgeClass}">${item.zone}</span></td>
      <td>${item.order}</td>
      <td>${item.capacity.toLocaleString()} m³</td>
      <td><span style="color:#10b981; font-weight:600;">${item.recharge.toLocaleString()} m³</span></td>
      <td>₹${item.cost.toLocaleString()}</td>
      <td><span style="font-weight:600;">${item.status}</span></td>
    `;

    tr.addEventListener('click', () => {
      // Find marker and open popup
      const marker = mapLayers.markers.find(m => m.interventionData.id === item.id);
      if (marker && window.watershedMap) {
        // Switch to GIS studio tab if not already
        const gisTabBtn = document.querySelector('[data-tab="gis-studio"]');
        if (gisTabBtn) gisTabBtn.click();
        window.watershedMap.setView(item.coords, 16);
        marker.openPopup();
      }
    });

    tbody.appendChild(tr);
  });
}

function loadWatershedData(key) {
  if (!WATERSHED_DB[key]) return;
  currentWatershedKey = key;
  const data = WATERSHED_DB[key];

  // Update KPI counters
  document.getElementById('kpi-area').textContent = data.area_ha;
  document.getElementById('kpi-rainfall').textContent = data.rainfall_mm;
  document.getElementById('kpi-slope').textContent = data.avg_slope + '%';
  document.getElementById('kpi-structures').textContent = data.interventions.length;

  // Re-draw map
  drawWatershedFeatures(data);

  // Recalculate hydrology
  const areaSlider = document.getElementById('slider-area');
  const rainSlider = document.getElementById('slider-rainfall');
  if (areaSlider) areaSlider.value = data.area_ha;
  if (rainSlider) rainSlider.value = data.rainfall_mm;
  recomputeHydrology();
}

/* =========================================================================
   4. HYDROLOGY & RUNOFF SIMULATOR (SCS-CN METHOD)
   ========================================================================= */
let waterBalanceChart = null;

function initHydrologySimulator() {
  const rainSlider = document.getElementById('slider-rainfall');
  const areaSlider = document.getElementById('slider-area');
  const soilSelect = document.getElementById('select-soil-group');
  const lulcSelect = document.getElementById('select-lulc');

  if (rainSlider) rainSlider.addEventListener('input', recomputeHydrology);
  if (areaSlider) areaSlider.addEventListener('input', recomputeHydrology);
  if (soilSelect) soilSelect.addEventListener('change', recomputeHydrology);
  if (lulcSelect) lulcSelect.addEventListener('change', recomputeHydrology);

  initWaterBalanceChart();
  recomputeHydrology();
}

function computeCurveNumber(soilGroup, lulc) {
  // SCS-CN lookup table
  const cnTable = {
    agriculture: { A: 64, B: 75, C: 83, D: 87 },
    scrubland:   { A: 48, B: 67, C: 77, D: 83 },
    afforestation:{ A: 36, B: 60, C: 70, D: 77 },
    wasteland:   { A: 71, B: 80, C: 87, D: 90 },
    settlement:  { A: 77, B: 85, C: 90, D: 92 }
  };

  if (cnTable[lulc] && cnTable[lulc][soilGroup]) {
    return cnTable[lulc][soilGroup];
  }
  return 75;
}

function recomputeHydrology() {
  const rainSlider = document.getElementById('slider-rainfall');
  const areaSlider = document.getElementById('slider-area');
  const soilSelect = document.getElementById('select-soil-group');
  const lulcSelect = document.getElementById('select-lulc');

  if (!rainSlider || !areaSlider) return;

  const P = parseFloat(rainSlider.value);
  const A = parseFloat(areaSlider.value);
  const soil = soilSelect ? soilSelect.value : 'B';
  const lulc = lulcSelect ? lulcSelect.value : 'agriculture';

  document.getElementById('label-rainfall-val').textContent = P + ' mm';
  document.getElementById('label-area-val').textContent = A + ' ha';

  const CN = computeCurveNumber(soil, lulc);
  document.getElementById('res-cn-val').textContent = CN;

  // Potential max retention S in mm
  const S = (25400 / CN) - 254;
  const Ia = 0.2 * S;

  // Direct Runoff Depth Q in mm
  let Q = 0;
  if (P > Ia) {
    Q = Math.pow(P - Ia, 2) / (P - Ia + S);
  }

  // Infiltration Depth (P - Q)
  const Infiltration = Math.max(0, P - Q);

  // Volumes in Cubic Meters (m³)
  // Volume = Depth(mm) * Area(ha) * 10
  const totalRainfallVol = P * A * 10;
  const directRunoffVol = Q * A * 10;
  const infiltrationVol = Infiltration * A * 10;
  const harvestableVol = directRunoffVol * 0.70; // 70% harvestable design target
  const runoffCoeff = P > 0 ? ((Q / P) * 100).toFixed(1) : 0;

  // Update UI Metrics
  document.getElementById('res-runoff-depth').textContent = Q.toFixed(1) + ' mm';
  document.getElementById('res-runoff-vol').textContent = (directRunoffVol / 1000).toFixed(1) + ' k m³';
  document.getElementById('res-infil-vol').textContent = (infiltrationVol / 1000).toFixed(1) + ' k m³';
  document.getElementById('res-harvest-vol').textContent = (harvestableVol / 1000).toFixed(1) + ' k m³';
  document.getElementById('res-runoff-ratio').textContent = runoffCoeff + '%';

  // Update formula snippet
  const formulaText = `S = (25400 / ${CN}) - 254 = ${S.toFixed(1)} mm | Ia = ${Ia.toFixed(1)} mm\n` +
                      `Q = (${P} - ${Ia.toFixed(1)})² / (${P} - ${Ia.toFixed(1)} + ${S.toFixed(1)}) = ${Q.toFixed(1)} mm\n` +
                      `Total Catchment Yield = ${directRunoffVol.toLocaleString(undefined, {maximumFractionDigits:0})} m³`;
  const formulaBox = document.getElementById('hydrology-formula-display');
  if (formulaBox) formulaBox.textContent = formulaText;

  // Update Chart
  updateWaterBalanceChart(directRunoffVol, infiltrationVol, harvestableVol);

  // ── Update SVG cross-section water table (live) ──────────────────────────
  // P range 50–1800 mm → water table y range 210 (deep/drought) to 130 (high/flood)
  const wtY = Math.round(210 - ((P - 50) / (1800 - 50)) * 80);
  const depthM = (((wtY - 130) / 80) * 7 + 5).toFixed(1); // maps y to ~5–12 mbgl

  const wtRect = document.getElementById('hx-water-rect');
  const wtWave = document.getElementById('hx-water-wave');
  const wtTxt  = document.getElementById('hx-wl-txt');
  const rainLbl = document.querySelector('#hydro-xsec text[font-size="12"]');

  if (wtRect) { wtRect.setAttribute('y', wtY); wtRect.setAttribute('height', 290 - wtY); }
  if (wtWave) {
    wtWave.setAttribute('d', `M0,${wtY} Q115,${wtY-3} 230,${wtY} Q345,${wtY+3} 460,${wtY} Q575,${wtY-3} 690,${wtY} Q805,${wtY+3} 920,${wtY}`);
  }
  if (wtTxt)  { wtTxt.setAttribute('y', wtY - 4); wtTxt.textContent = `WL: ${depthM}m`; }
  if (rainLbl) rainLbl.textContent = `\u2602 P = ${P} mm / 24h`;
}

function initWaterBalanceChart() {
  const ctx = document.getElementById('water-balance-chart');
  if (!ctx) return;

  waterBalanceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Harvestable Runoff', 'Uncaptured Surplus Runoff', 'Soil Infiltration & Recharge'],
      datasets: [{
        data: [70, 30, 100],
        backgroundColor: ['#10b981', '#06b6d4', '#38bdf8'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
        }
      },
      cutout: '68%'
    }
  });
}

function updateWaterBalanceChart(runoff, infiltration, harvestable) {
  if (!waterBalanceChart) return;
  const uncaptured = Math.max(0, runoff - harvestable);
  waterBalanceChart.data.datasets[0].data = [
    Math.round(harvestable),
    Math.round(uncaptured),
    Math.round(infiltration)
  ];
  waterBalanceChart.update();
}

/* =========================================================================
   5. CLEAN ENERGY & SOLAR PUMPING ESTIMATOR
   ========================================================================= */
function initSolarEnergyCalculator() {
  const headSlider = document.getElementById('slider-dynamic-head');
  const dischargeSlider = document.getElementById('slider-daily-discharge');
  const pshSlider = document.getElementById('slider-peak-sun-hours');

  if (headSlider) headSlider.addEventListener('input', recomputeSolarEnergy);
  if (dischargeSlider) dischargeSlider.addEventListener('input', recomputeSolarEnergy);
  if (pshSlider) pshSlider.addEventListener('input', recomputeSolarEnergy);

  recomputeSolarEnergy();
}

function recomputeSolarEnergy() {
  const headSlider = document.getElementById('slider-dynamic-head');
  const dischargeSlider = document.getElementById('slider-daily-discharge');
  const pshSlider = document.getElementById('slider-peak-sun-hours');

  if (!headSlider || !dischargeSlider) return;

  const H = parseFloat(headSlider.value); // meters
  const Qd = parseFloat(dischargeSlider.value); // m3/day
  const PSH = pshSlider ? parseFloat(pshSlider.value) : 5.5; // hours

  document.getElementById('label-head-val').textContent = H + ' m';
  document.getElementById('label-discharge-val').textContent = Qd + ' m³/day';
  if (document.getElementById('label-psh-val')) {
    document.getElementById('label-psh-val').textContent = PSH + ' hrs';
  }

  // Hourly flow rate during sunlight: Q_hr = Qd / PSH (m3/hr)
  // Hydraulic Power Ph (kW) = (rho * g * Q * H) / 3600000
  // With rho = 1000 kg/m3, g = 9.81 m/s2:
  // Ph = (9.81 * (Qd / PSH) * H) / 3600
  const flowPerSec = (Qd / (PSH * 3600)); // m3/s
  const hydraulicPower_kW = (1000 * 9.81 * flowPerSec * H) / 1000;

  // Pump-motor combined efficiency ~ 65%
  const pumpEfficiency = 0.65;
  const electricalPower_kW = hydraulicPower_kW / pumpEfficiency;
  const pump_HP = electricalPower_kW * 1.341;

  // Solar PV array with 1.25 safety/dust/temperature derating factor
  const solarPV_kWp = electricalPower_kW * 1.25;

  // Annual energy produced (kWh/yr) = electricalPower_kW * PSH * 300 sunny days
  const annualEnergy_kWh = electricalPower_kW * PSH * 300;

  // Diesel saved: 0.32 L/kWh
  const dieselSavedLiters = annualEnergy_kWh * 0.32;

  // CO2 avoided: 2.68 kg CO2 / liter diesel
  const co2AvoidedKg = dieselSavedLiters * 2.68;

  // UI Updates
  document.getElementById('res-pump-power').textContent = pump_HP.toFixed(1) + ' HP (' + electricalPower_kW.toFixed(2) + ' kW)';
  document.getElementById('res-solar-rating').textContent = solarPV_kWp.toFixed(2) + ' kWp';
  document.getElementById('res-annual-energy').textContent = Math.round(annualEnergy_kWh).toLocaleString() + ' kWh/yr';
  document.getElementById('res-diesel-saved').textContent = Math.round(dieselSavedLiters).toLocaleString() + ' L/yr';
  document.getElementById('res-co2-offset').textContent = (co2AvoidedKg / 1000).toFixed(2) + ' Tonnes/yr';
}

/* =========================================================================
   6. FIELD GEO-CAMERA & BEFORE/AFTER SPLIT SLIDER
   ========================================================================= */
function initSplitPhotoSlider() {
  const container = document.getElementById('comparison-box');
  const afterImage = document.getElementById('split-after-img');
  const handle = document.getElementById('slider-divider-handle');

  if (!container || !afterImage || !handle) return;

  let isDragging = false;

  const updateSplit = (clientX) => {
    const rect = container.getBoundingClientRect();
    let offsetX = clientX - rect.left;
    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;

    const percentage = (offsetX / rect.width) * 100;
    afterImage.style.width = percentage + '%';
    handle.style.left = percentage + '%';
  };

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSplit(e.clientX);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSplit(e.clientX);
  });

  // Touch support for mobile devices
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSplit(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSplit(e.touches[0].clientX);
  });

  // Simulated photo upload
  const fileInput = document.getElementById('field-photo-upload');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          afterImage.style.backgroundImage = `url('${event.target.result}')`;
          document.getElementById('telemetry-status-badge').innerHTML = 
            `<span style="color:#10b981; font-weight:600;">Geo-Tag Verified (Within 12m Geofence)</span>`;
          document.getElementById('telemetry-timestamp').textContent = new Date().toISOString().replace('T', ' ').substring(0, 19);
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/* =========================================================================
   7. DPR MODAL & EXPORT ENGINE
   ========================================================================= */
function initDPRModal() {
  const openBtn = document.getElementById('btn-export-dpr');
  const modal = document.getElementById('dpr-modal');
  const closeBtn = document.getElementById('btn-close-modal');
  const printBtn = document.getElementById('btn-print-dpr');
  const downloadJsonBtn = document.getElementById('btn-download-json');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      populateDPRSummary();
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
      downloadProjectJSON();
    });
  }
}

function populateDPRSummary() {
  const currentWS = WATERSHED_DB[currentWatershedKey];
  const container = document.getElementById('dpr-content-body');
  if (!container) return;

  const totalCost = currentWS.interventions.reduce((sum, item) => sum + item.cost, 0);
  const totalRecharge = currentWS.interventions.reduce((sum, item) => sum + item.recharge, 0);
  const totalStorage = currentWS.interventions.reduce((sum, item) => sum + item.capacity, 0);

  container.innerHTML = `
    <div style="border-bottom:2px solid #10b981; padding-bottom:12px; margin-bottom:20px;">
      <h3 style="font-size:1.3rem; color:var(--text-primary, #0c1a2e);">Detailed Project Report (DPR)</h3>
      <p style="color:var(--text-muted, #64748b); font-size:0.85rem;">Project ID: ${currentWS.id} | Generated on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:25px;">
      <div style="background:#f8fafc; border:1px solid rgba(14,165,233,0.18); padding:15px; border-radius:8px;">
        <h4 style="color:#059669; margin-bottom:8px;">Watershed Baseline</h4>
        <p><strong>Name:</strong> ${currentWS.name}</p>
        <p><strong>Total Catchment Area:</strong> ${currentWS.area_ha} ha</p>
        <p><strong>Design Annual Rainfall:</strong> ${currentWS.rainfall_mm} mm</p>
        <p><strong>Hydrologic Soil Group:</strong> Group ${currentWS.soil_group}</p>
        <p><strong>Composite Curve Number (CN):</strong> ${currentWS.curve_number}</p>
      </div>

      <div style="background:#f8fafc; border:1px solid rgba(14,165,233,0.18); padding:15px; border-radius:8px;">
        <h4 style="color:#0284c7; margin-bottom:8px;">Intervention Economics</h4>
        <p><strong>Total Planned Interventions:</strong> ${currentWS.interventions.length} structures</p>
        <p><strong>Total Water Storage Capacity:</strong> ${totalStorage.toLocaleString()} m³</p>
        <p><strong>Estimated Annual Groundwater Recharge:</strong> ${totalRecharge.toLocaleString()} m³</p>
        <p><strong>Total Budget Estimate:</strong> ₹${totalCost.toLocaleString()}</p>
        <p><strong>Cost per m³ Recharged:</strong> ₹${(totalCost / totalRecharge).toFixed(2)}/m³</p>
      </div>
    </div>

    <h4 style="color:var(--text-primary, #0c1a2e); margin-bottom:10px;">Interventions Schedule</h4>
    <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
      <thead>
        <tr style="border-bottom:1px solid #cbd5e1; color:#64748b;">
          <th style="padding:8px;">ID</th>
          <th style="padding:8px;">Structure</th>
          <th style="padding:8px;">Zone</th>
          <th style="padding:8px;">Storage (m³)</th>
          <th style="padding:8px;">Recharge (m³)</th>
          <th style="padding:8px;">Cost (INR)</th>
          <th style="padding:8px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${currentWS.interventions.map(i => `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:8px;">${i.id}</td>
            <td style="padding:8px; font-weight:600;">${i.type}</td>
            <td style="padding:8px;">${i.zone}</td>
            <td style="padding:8px;">${i.capacity.toLocaleString()}</td>
            <td style="padding:8px; color:#10b981;">${i.recharge.toLocaleString()}</td>
            <td style="padding:8px;">₹${i.cost.toLocaleString()}</td>
            <td style="padding:8px;">${i.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function downloadProjectJSON() {
  const currentWS = WATERSHED_DB[currentWatershedKey];
  const reportData = {
    metadata: {
      generated_at: new Date().toISOString(),
      system: "AQUANEXIS Decision Support Platform v2.0",
      standard: "WDC-PMKSY 2.0 Compliant"
    },
    watershed: currentWS
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${currentWS.id}_DPR_Plan.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/* =========================================================================
   10. OUTCOME MONITORING – CHARTS
   ========================================================================= */
function initMonitoringCharts() {
  // --- Groundwater Table Recovery (line chart, mbgl – lower is better) ---
  const gwCtx = document.getElementById('groundwater-trend-chart');
  if (!gwCtx) return;
  new Chart(gwCtx, {
    type: 'line',
    data: {
      labels: ['Pre-Monsoon 2023 (Baseline)', 'Post-Monsoon 2023', 'Pre-Monsoon 2024', 'Post-Monsoon 2024',
               'Pre-Monsoon 2025', 'Post-Monsoon 2025', 'Pre-Monsoon 2026 (Now)'],
      datasets: [
        {
          label: 'Groundwater Depth (mbgl)',
          data: [14.2, 11.8, 12.1, 9.3, 10.6, 7.9, 8.4],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.12)',
          tension: 0.42,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointRadius: 5,
        },
        {
          label: 'Target Trajectory',
          data: [14.2, 12.5, 11.0, 9.5, 9.0, 8.0, 7.5],
          borderColor: 'rgba(251,191,36,0.6)',
          borderDash: [6,4],
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} mbgl`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          reverse: true,
          ticks: { color: '#94a3b8', callback: v => v + ' m' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: 'Depth Below Ground (m)', color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });

  // --- Spectral Indices Grouped Bar (Sentinel-2) ---
  const siCtx = document.getElementById('spectral-indices-chart');
  if (!siCtx) return;
  new Chart(siCtx, {
    type: 'bar',
    data: {
      labels: ['Kharif 2023\n(Baseline)', 'Rabi 2024', 'Kharif 2024', 'Rabi 2025', 'Kharif 2025'],
      datasets: [
        {
          label: 'NDVI (Vegetation)',
          data: [0.38, 0.43, 0.51, 0.56, 0.64],
          backgroundColor: 'rgba(16,185,129,0.75)',
          borderRadius: 4,
        },
        {
          label: 'MNDWI (Surface Water)',
          data: [0.12, 0.18, 0.24, 0.28, 0.34],
          backgroundColor: 'rgba(56,189,248,0.75)',
          borderRadius: 4,
        },
        {
          label: 'BSI (Bare Soil, lower=better)',
          data: [0.41, 0.35, 0.30, 0.26, 0.22],
          backgroundColor: 'rgba(251,191,36,0.65)',
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1', font: { size: 10 } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          min: 0,
          max: 0.8,
          ticks: { color: '#94a3b8', font: { size: 9 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: 'Index Value', color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });

  // --- 5 Impact Doughnut Ring Gauges ---
  function _gauge(id, pct, color) {
    const el = document.getElementById(id);
    if (!el) return;
    new Chart(el, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [color, 'rgba(255,255,255,0.07)'],
          borderWidth: 0,
          circumference: 270,
          rotation: -135,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }
  _gauge('gauge-gw',     59,  '#10b981');
  _gauge('gauge-ndvi',   68,  '#38bdf8');
  _gauge('gauge-crop',   72,  '#f59e0b');
  _gauge('gauge-water',  100, '#10b981');
  _gauge('gauge-carbon', 44,  '#a78bfa');

  // --- Socioeconomic Uplift Horizontal Bar ---
  const socCtx = document.getElementById('socioeconomic-bar-chart');
  if (socCtx) {
    new Chart(socCtx, {
      type: 'bar',
      data: {
        labels: [
          'Household Income (₹k/yr)',
          'Irrigated Area (ha)',
          'Functional Wells (%)',
          'Crop Yield (Qtl/ha)',
          'Women SHG Income (₹k/yr)',
          'Livestock Fodder (%)'
        ],
        datasets: [
          {
            label: 'Before Intervention (2023)',
            data: [38, 120, 42, 11, 14, 38],
            backgroundColor: 'rgba(239,68,68,0.65)',
            borderRadius: 4,
            barThickness: 14,
          },
          {
            label: 'After Intervention (2026)',
            data: [64, 265, 87, 19, 31, 78],
            backgroundColor: 'rgba(16,185,129,0.75)',
            borderRadius: 4,
            barThickness: 14,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}

/* =========================================================================
   11. INTERVENTIONS TABLE – VISUAL PROGRESS BARS
   ========================================================================= */
function initInterventionProgressBars() {
  // After the interventions table is rendered, inject progress cells
  // Called lazily when user clicks the interventions tab or on load
  const observer = new MutationObserver(() => {
    const table = document.querySelector('#interventions-tab table');
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (!cells.length || cells[cells.length - 1].classList.contains('_prog')) return;
      // Replace last status cell with a pill + mini bar
      const statusCell = cells[cells.length - 1];
      const statusText = statusCell.textContent.trim();
      const pct = statusText.includes('Completed') ? 100
                : statusText.includes('Progress') ? 60
                : statusText.includes('Design')   ? 30
                : 10;
      const col = pct === 100 ? '#10b981' : pct >= 60 ? '#38bdf8' : '#f59e0b';
      statusCell.classList.add('_prog');
      statusCell.innerHTML = `
        <div style="font-size:0.75rem; margin-bottom:4px; color:${col}; font-weight:600;">${statusText}</div>
        <div style="background:rgba(255,255,255,0.08); border-radius:20px; height:6px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${col}; border-radius:20px;"></div>
        </div>`;
    });
  });
  const target = document.getElementById('interventions-tab');
  if (target) observer.observe(target, { childList: true, subtree: true });
}
/* =========================================================================
   LOCATION PICKER — Satellite Map + Watershed Analysis Engine
   ========================================================================= */
let locPickerMap = null;
let locPickerMarker = null;

function initLocationPicker() {
  const mapEl = document.getElementById('loc-picker-map');
  if (!mapEl || typeof L === 'undefined') return;

  // Build Leaflet map centred on Karnataka, India
  locPickerMap = L.map('loc-picker-map', { zoomControl: true, attributionControl: false })
    .setView([14.82, 75.46], 8);

  // Esri World Imagery (satellite)
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Esri | Maxar' }
  ).addTo(locPickerMap);

  // Labels overlay
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, opacity: 0.7 }
  ).addTo(locPickerMap);

  // Click handler
  locPickerMap.on('click', (e) => runWatershedAnalysis(e.latlng.lat, e.latlng.lng));
}

// UI state helpers
function lpShow(state) {
  document.getElementById('loc-idle-state').style.display    = state==='idle'    ? 'flex' : 'none';
  document.getElementById('loc-loading-state').style.display = state==='loading' ? 'flex' : 'none';
  document.getElementById('loc-results-state').style.display = state==='results' ? 'flex' : 'none';
}
function lpSetLoading(msg) {
  lpShow('loading');
  document.getElementById('loc-loading-msg').textContent = msg;
}
function lpSetBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, pct) + '%';
}
function lpSet(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

// Custom drop pin icon
function buildMarkerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;">
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mg" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </radialGradient>
        </defs>
        <path d="M16 2 C8.3 2 2 8.3 2 16 C2 26 16 40 16 40 C16 40 30 26 30 16 C30 8.3 23.7 2 16 2Z"
              fill="url(#mg)" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#fff" opacity=".9"/>
        <circle cx="16" cy="16" r="3" fill="#0ea5e9"/>
      </svg>
      <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
                  width:8px;height:4px;background:rgba(0,0,0,.3);border-radius:50%;filter:blur(2px);"></div>
    </div>`,
    iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -44]
  });
}

// Main analysis orchestrator
async function runWatershedAnalysis(lat, lng) {
  const hint = document.getElementById('loc-map-hint');
  if (hint) hint.style.display = 'none';

  document.getElementById('loc-coords-badge').textContent =
    `\u{1F4CD} ${lat.toFixed(5)}\u00B0 N, ${lng.toFixed(5)}\u00B0 E`;

  if (locPickerMarker) locPickerMarker.remove();
  locPickerMarker = L.marker([lat, lng], { icon: buildMarkerIcon() }).addTo(locPickerMap);

  lpShow('loading');
  const results = {};

  // 1. Elevation
  lpSetLoading('\u{1F3D4}\uFE0F  Fetching elevation & terrain data\u2026');
  try {
    const r = await fetch(`https://api.open-topo-data.com/v1/srtm30m?locations=${lat},${lng}`);
    const d = await r.json();
    results.elev = d.results?.[0]?.elevation ?? null;
  } catch(e) { results.elev = null; }

  // 2. Rainfall (Open-Meteo)
  lpSetLoading('\u{1F327}\uFE0F  Fetching 30-day rainfall data\u2026');
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=precipitation_sum&timezone=auto&past_days=30&forecast_days=1`;
    const r = await fetch(url);
    const d = await r.json();
    const vals = d.daily?.precipitation_sum ?? [];
    results.rainfall30 = vals.reduce((a, v) => a + (v || 0), 0);
    results.rainfallAvgAnnual = results.rainfall30 * (365 / 30);
  } catch(e) { results.rainfall30 = null; results.rainfallAvgAnnual = null; }

  // 3. Soil (SoilGrids)
  lpSetLoading('\u{1FAA8}  Querying SoilGrids for soil properties\u2026');
  try {
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}` +
      `&property=clay&property=sand&property=bdod&depth=0-30cm&value=mean`;
    const r = await fetch(url);
    const d = await r.json();
    const props = d.properties?.layers ?? [];
    const getVal = (name) => props.find(l => l.name === name)?.depths?.[0]?.values?.mean ?? null;
    results.clay = getVal('clay');
    results.sand = getVal('sand');
    const clayPct = results.clay ? results.clay / 10 : null;
    const sandPct = results.sand ? results.sand / 10 : null;
    if (clayPct !== null) {
      if (sandPct > 70) results.hsg = 'A';
      else if (clayPct < 20 && sandPct > 40) results.hsg = 'B';
      else if (clayPct < 40) results.hsg = 'C';
      else results.hsg = 'D';
    } else { results.hsg = 'B'; }
  } catch(e) { results.clay = null; results.sand = null; results.hsg = 'B'; }

  // 4. Nearest river (Overpass)
  lpSetLoading('\u{1F30A}  Searching for rivers & streams (OSM)\u2026');
  try {
    const q = `[out:json][timeout:12];(way["waterway"~"^(river|stream|canal|drain)$"](around:8000,${lat},${lng}););out center 3;`;
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: 'data=' + encodeURIComponent(q)
    });
    const d = await r.json();
    const els = d.elements ?? [];
    if (els.length > 0) {
      const n = els[0];
      results.riverName = n.tags?.name ?? n.tags?.waterway ?? 'Unnamed waterway';
      results.riverType = n.tags?.waterway ?? 'waterway';
      const c = n.center ?? { lat, lon: lng };
      results.riverDistM = Math.round(haversineM(lat, lng, c.lat, c.lon));
    } else { results.riverName = null; results.riverDistM = null; results.riverType = null; }
  } catch(e) { results.riverName = null; results.riverDistM = null; results.riverType = null; }

  // 5. Nearest water body (Overpass)
  lpSetLoading('\u{1F4A7}  Searching for water bodies (OSM)\u2026');
  try {
    const q = `[out:json][timeout:12];(way["natural"="water"](around:10000,${lat},${lng});relation["natural"="water"](around:10000,${lat},${lng}););out center 3;`;
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: 'data=' + encodeURIComponent(q)
    });
    const d = await r.json();
    const els = d.elements ?? [];
    if (els.length > 0) {
      const n = els[0];
      results.waterName = n.tags?.name ?? n.tags?.water ?? 'Water body';
      const c = n.center ?? { lat, lon: lng };
      results.waterDistM = Math.round(haversineM(lat, lng, c.lat, c.lon));
    } else { results.waterName = null; results.waterDistM = null; }
  } catch(e) { results.waterName = null; results.waterDistM = null; }

  // 6. Reverse geocode (Nominatim)
  lpSetLoading('\u{1F4CD}  Resolving location name\u2026');
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await r.json();
    results.placeName = d.address?.village ?? d.address?.town ??
                        d.address?.city ?? d.address?.county ?? d.display_name?.split(',')[0];
    results.district = d.address?.county ?? d.address?.state_district ?? '';
    results.state    = d.address?.state ?? '';
  } catch(e) { results.placeName = 'Selected Location'; results.district = ''; results.state = ''; }

  // Compute score & render
  results.score = computeWatershedScore(results);
  renderAnalysisResults(lat, lng, results);

  const scoreColor = results.score >= 70 ? '#10b981' : results.score >= 45 ? '#f59e0b' : '#ef4444';
  locPickerMarker.bindPopup(
    `<div style="font-family:'Courier New',monospace;font-size:11px;line-height:1.7;color:#0f172a;">
      <strong style="font-size:13px;">${results.placeName ?? 'Location'}</strong><br>
      Watershed Score: <strong style="color:${scoreColor}">${results.score}/100</strong><br>
      Elev: ${results.elev != null ? results.elev+'m' : 'N/A'} &nbsp;|&nbsp;
      Rain: ${results.rainfall30 != null ? results.rainfall30.toFixed(0)+'mm/30d' : 'N/A'}
    </div>`
  ).openPopup();
}

// Haversine distance in metres
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Composite watershed scoring (0-100)
function computeWatershedScore(r) {
  let score = 0;
  const elev = r.elev ?? 400;
  if (elev > 100 && elev < 1200) score += 20; else if (elev >= 50) score += 10;
  const annualRain = r.rainfallAvgAnnual ?? 800;
  if (annualRain >= 600 && annualRain <= 2000) score += 25; else if (annualRain >= 400) score += 12;
  const hsgScore = { A: 15, B: 22, C: 18, D: 10 };
  score += hsgScore[r.hsg] ?? 15;
  const rd = r.riverDistM ?? 9999;
  if (rd < 1000) score += 20; else if (rd < 3000) score += 14; else if (rd < 6000) score += 8; else score += 3;
  const wd = r.waterDistM ?? 9999;
  if (wd < 2000) score += 15; else if (wd < 5000) score += 10; else if (wd < 9000) score += 5;
  return Math.min(100, Math.round(score));
}

// Render results panel
function renderAnalysisResults(lat, lng, r) {
  lpShow('results');
  const score = r.score;
  const circ = 188.5;
  const offset = circ - (circ * score / 100);
  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const arc = document.getElementById('loc-score-arc');
  const val = document.getElementById('loc-score-val');
  const lbl = document.getElementById('loc-score-label');
  if (arc) { arc.style.strokeDashoffset = offset; arc.style.stroke = scoreColor; }
  if (val) { val.textContent = score; val.style.fill = scoreColor; }
  const level = score >= 70 ? 'HIGH POTENTIAL \u2713' : score >= 45 ? 'MODERATE POTENTIAL' : 'LOW POTENTIAL';
  if (lbl) { lbl.textContent = level; lbl.style.color = scoreColor; }
  const place = document.getElementById('loc-place-name');
  if (place) place.textContent = [r.placeName, r.district, r.state].filter(Boolean).join(', ');

  // Elevation
  lpSet('loc-elev-val', r.elev != null ? `${r.elev} m ASL` : 'N/A');
  lpSetBar('loc-elev-bar', r.elev != null ? Math.min(100, (r.elev / 1200) * 100) : 0);

  // Rainfall
  lpSet('loc-rain-val', r.rainfall30 != null
    ? `${r.rainfall30.toFixed(1)} mm (30d) \u2248 ${Math.round(r.rainfallAvgAnnual)} mm/yr` : 'N/A');
  lpSetBar('loc-rain-bar', r.rainfallAvgAnnual != null ? Math.min(100, (r.rainfallAvgAnnual / 2000) * 100) : 0);

  // Soil
  const hsgLabels = {
    A: 'HSG-A \u2014 High infiltration (Deep sand / loess)',
    B: 'HSG-B \u2014 Moderate infiltration (Sandy loam)',
    C: 'HSG-C \u2014 Slow infiltration (Clay loam)',
    D: 'HSG-D \u2014 Very slow (Heavy clay / high WT)'
  };
  lpSet('loc-soil-val', hsgLabels[r.hsg] ?? 'Unknown');
  lpSetBar('loc-soil-bar', { A: 90, B: 70, C: 45, D: 25 }[r.hsg] ?? 50);

  // River
  lpSet('loc-river-val', r.riverName
    ? `${r.riverName} (${r.riverType}) \u2014 ${r.riverDistM > 999 ? (r.riverDistM/1000).toFixed(1)+' km' : r.riverDistM+' m'} away`
    : 'No waterway found within 8 km');
  lpSetBar('loc-river-bar', r.riverDistM != null ? Math.max(0, 100 - (r.riverDistM / 80)) : 10);

  // Water body
  lpSet('loc-water-val', r.waterName
    ? `${r.waterName} \u2014 ${r.waterDistM > 999 ? (r.waterDistM/1000).toFixed(1)+' km' : r.waterDistM+' m'} away`
    : 'No water body found within 10 km');
  lpSetBar('loc-water-bar', r.waterDistM != null ? Math.max(0, 100 - (r.waterDistM / 100)) : 10);

  // Recommendations
  const lines = [];
  const elev = r.elev ?? 400;
  const rain = r.rainfallAvgAnnual ?? 800;
  if (elev > 400) lines.push('\u{1F33F} <strong>Contour Trenches (CCT)</strong> \u2014 ridge moisture retention');
  if (r.riverDistM != null && r.riverDistM < 5000) lines.push('\u{1FAA8} <strong>Check Dam</strong> \u2014 stream flow capture');
  if (rain > 500) lines.push('\u{1F4A7} <strong>Percolation Pond</strong> \u2014 runoff recharge');
  if (r.hsg === 'C' || r.hsg === 'D') lines.push('\u{1F529} <strong>Gully Plugs</strong> \u2014 erosion control on clay slopes');
  if (r.hsg === 'A' || r.hsg === 'B') lines.push('\u{1F33E} <strong>Farm Ponds</strong> \u2014 high suitability for storage');
  if (!r.waterName) lines.push('\u26CF\uFE0F <strong>New Reservoir/Tank</strong> \u2014 no existing water body nearby');
  if (rain < 400) lines.push('\u2600\uFE0F <strong>Solar Pump</strong> \u2014 low rain, groundwater dependency');
  if (score >= 70) lines.push('\u2705 <strong>HIGH PRIORITY</strong> for PMKSY-2.0 DPR submission');
  else if (score >= 45) lines.push('\u26A0\uFE0F <strong>MODERATE</strong> \u2014 feasibility study recommended');
  else lines.push('\u{1F534} <strong>LOW</strong> \u2014 consider alternative sites');
  const recEl = document.getElementById('loc-rec-text');
  if (recEl) recEl.innerHTML = lines.join('<br>') || 'No recommendations computed.';
}
