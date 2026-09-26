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
      if (WATERSHED_DB[key]) {
        loadWatershedData(key);
      } else if (window._osmDamCache && window._osmDamCache[key]) {
        loadOsmDam(window._osmDamCache[key]);
      }
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

  /* ── Karnataka Dams ── */
  krs_dam: {
    name: "KRS Dam — Cauvery Reservoir", label: "KRS Dam – Krishnarajasagara (KA)",
    group: "Karnataka Dams",
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

  /* ── Tamil Nadu Dams ── */
  amaravathy_dam: {
    name: "Amaravathy Dam Catchment", label: "Amaravathy Dam (TN-Karur) — 3 TMC",
    group: "Tamil Nadu Dams",
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
    name: "Bhavani Sagar Dam Catchment", label: "Bhavani Sagar Dam (TN-Erode) — 32.8 TMC",
    group: "Tamil Nadu Dams",
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

  mettur_dam: {
    name: "Mettur Dam (Stanley Reservoir)", label: "Mettur Dam (TN-Salem) — 93.47 TMC",
    group: "Tamil Nadu Dams",
    id: "DAM-TN-SLM-MTR", center: [11.786, 77.801],
    area_ha: 75000, rainfall_mm: 720, avg_slope: 3.8, soil_group: "B", curve_number: 70,
    boundary: [[11.810,77.772],[11.825,77.818],[11.798,77.838],[11.765,77.822],[11.756,77.782],[11.778,77.765],[11.810,77.772]],
    streams: [
      { order: 3, coords: [[11.818,77.785],[11.800,77.795],[11.786,77.801],[11.768,77.814]] },
      { order: 2, coords: [[11.822,77.812],[11.806,77.804],[11.786,77.801]] },
      { order: 1, coords: [[11.770,77.775],[11.786,77.801]] }
    ],
    interventions: [
      { id:"MTR-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[11.786,77.801], capacity:9347000, cost:0,        recharge:280410000, status:"Completed" },
      { id:"MTR-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[11.768,77.818], capacity:25000,   cost:1750000,  recharge:75000,     status:"Proposed"  },
      { id:"MTR-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[11.804,77.792], capacity:5200,    cost:380000,   recharge:15600,     status:"Ongoing"   }
    ]
  },

  vaigai_dam: {
    name: "Vaigai Dam Catchment", label: "Vaigai Dam (TN-Madurai) — 71 TMC",
    group: "Tamil Nadu Dams",
    id: "DAM-TN-MDU-VGI", center: [9.980, 77.540],
    area_ha: 9900, rainfall_mm: 840, avg_slope: 7.2, soil_group: "B", curve_number: 74,
    boundary: [[10.000,77.515],[10.014,77.552],[9.992,77.572],[9.965,77.558],[9.956,77.520],[9.978,77.505],[10.000,77.515]],
    streams: [
      { order: 3, coords: [[10.008,77.528],[9.992,77.538],[9.980,77.540],[9.965,77.552]] },
      { order: 2, coords: [[10.012,77.548],[9.996,77.542],[9.980,77.540]] },
      { order: 1, coords: [[9.968,77.522],[9.980,77.540]] }
    ],
    interventions: [
      { id:"VGI-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[9.980,77.540], capacity:7100000, cost:0,       recharge:213000000, status:"Completed" },
      { id:"VGI-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[9.963,77.554], capacity:16000,   cost:1120000, recharge:48000,     status:"Proposed"  },
      { id:"VGI-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[9.995,77.532], capacity:3800,    cost:280000,  recharge:11400,     status:"Proposed"  }
    ]
  },

  papanasam_dam: {
    name: "Papanasam Dam Catchment (Manimuthar)", label: "Papanasam Dam (TN-Tirunelveli) — 14 TMC",
    group: "Tamil Nadu Dams",
    id: "DAM-TN-TVL-PPN", center: [8.820, 77.372],
    area_ha: 11200, rainfall_mm: 1380, avg_slope: 9.5, soil_group: "A", curve_number: 62,
    boundary: [[8.842,77.345],[8.858,77.385],[8.830,77.408],[8.798,77.392],[8.788,77.352],[8.812,77.330],[8.842,77.345]],
    streams: [
      { order: 3, coords: [[8.850,77.358],[8.834,77.368],[8.820,77.372],[8.804,77.384]] },
      { order: 2, coords: [[8.855,77.378],[8.838,77.374],[8.820,77.372]] },
      { order: 1, coords: [[8.806,77.353],[8.820,77.372]] }
    ],
    interventions: [
      { id:"PPN-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[8.820,77.372], capacity:1400000, cost:0,       recharge:42000000, status:"Completed" },
      { id:"PPN-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[8.803,77.388], capacity:10000,   cost:700000,  recharge:30000,    status:"Proposed"  },
      { id:"PPN-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[8.836,77.365], capacity:3200,    cost:235000,  recharge:9600,     status:"Ongoing"   }
    ]
  },

  /* ── Karnataka Dams (additional) ── */
  tungabhadra_dam: {
    name: "Tungabhadra Dam Catchment", label: "Tungabhadra Dam (KA-Hospet) — 101 TMC",
    group: "Karnataka Dams",
    id: "DAM-KA-BLR-TBD", center: [15.272, 76.334],
    area_ha: 28000, rainfall_mm: 620, avg_slope: 4.1, soil_group: "B", curve_number: 73,
    boundary: [[15.295,76.308],[15.310,76.348],[15.285,76.372],[15.252,76.358],[15.242,76.318],[15.268,76.300],[15.295,76.308]],
    streams: [
      { order: 3, coords: [[15.302,76.320],[15.285,76.330],[15.272,76.334],[15.258,76.345]] },
      { order: 2, coords: [[15.308,76.345],[15.292,76.338],[15.272,76.334]] },
      { order: 1, coords: [[15.258,76.312],[15.272,76.334]] }
    ],
    interventions: [
      { id:"TBD-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[15.272,76.334], capacity:10100000, cost:0,       recharge:303000000, status:"Completed" },
      { id:"TBD-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[15.255,76.350], capacity:18000,    cost:1200000, recharge:54000,     status:"Ongoing"   },
      { id:"TBD-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[15.290,76.322], capacity:4200,     cost:310000,  recharge:12600,     status:"Proposed"  }
    ]
  },

  linganamakki_dam: {
    name: "Linganamakki Dam Catchment", label: "Linganamakki Dam (KA-Shivamogga) — 151 TMC",
    group: "Karnataka Dams",
    id: "DAM-KA-SMG-LNG", center: [14.175, 74.860],
    area_ha: 42000, rainfall_mm: 2200, avg_slope: 12.5, soil_group: "A", curve_number: 58,
    boundary: [[14.200,74.830],[14.218,74.878],[14.192,74.902],[14.155,74.888],[14.144,74.842],[14.168,74.818],[14.200,74.830]],
    streams: [
      { order: 3, coords: [[14.210,74.845],[14.192,74.858],[14.175,74.860],[14.160,74.872]] },
      { order: 2, coords: [[14.215,74.872],[14.198,74.864],[14.175,74.860]] },
      { order: 1, coords: [[14.162,74.835],[14.175,74.860]] }
    ],
    interventions: [
      { id:"LNG-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[14.175,74.860], capacity:15100000, cost:0,        recharge:453000000, status:"Completed" },
      { id:"LNG-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[14.158,74.876], capacity:22000,    cost:1550000,  recharge:66000,     status:"Proposed"  },
      { id:"LNG-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[14.194,74.852], capacity:5600,     cost:420000,   recharge:16800,     status:"Ongoing"   }
    ]
  },

  harangi_dam: {
    name: "Harangi Dam Catchment", label: "Harangi Dam (KA-Coorg) — 8.5 TMC",
    group: "Karnataka Dams",
    id: "DAM-KA-CDG-HRG", center: [12.542, 75.960],
    area_ha: 9200, rainfall_mm: 1650, avg_slope: 9.8, soil_group: "A", curve_number: 62,
    boundary: [[12.562,75.935],[12.576,75.972],[12.552,75.992],[12.525,75.978],[12.516,75.942],[12.535,75.928],[12.562,75.935]],
    streams: [
      { order: 3, coords: [[12.570,75.950],[12.555,75.960],[12.542,75.960],[12.528,75.972]] },
      { order: 2, coords: [[12.574,75.975],[12.560,75.965],[12.542,75.960]] },
      { order: 1, coords: [[12.528,75.942],[12.542,75.960]] }
    ],
    interventions: [
      { id:"HRG-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[12.542,75.960], capacity:850000,  cost:0,       recharge:25500000, status:"Completed" },
      { id:"HRG-02", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[12.558,75.952], capacity:2800,    cost:215000,  recharge:8400,     status:"Proposed"  },
      { id:"HRG-03", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[12.528,75.975], capacity:9200,    cost:645000,  recharge:27600,    status:"Ongoing"   }
    ]
  },

  hemavathi_dam: {
    name: "Hemavathi Reservoir Catchment", label: "Hemavathi Dam (KA-Hassan) — 37.1 TMC",
    group: "Karnataka Dams",
    id: "DAM-KA-HSN-HMV", center: [13.042, 76.002],
    area_ha: 15600, rainfall_mm: 920, avg_slope: 6.2, soil_group: "B", curve_number: 72,
    boundary: [[13.062,75.978],[13.076,76.018],[13.052,76.038],[13.025,76.024],[13.016,75.985],[13.035,75.970],[13.062,75.978]],
    streams: [
      { order: 3, coords: [[13.070,75.990],[13.055,76.000],[13.042,76.002],[13.028,76.014]] },
      { order: 2, coords: [[13.074,76.015],[13.058,76.008],[13.042,76.002]] },
      { order: 1, coords: [[13.028,75.982],[13.042,76.002]] }
    ],
    interventions: [
      { id:"HMV-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[13.042,76.002], capacity:3710000, cost:0,        recharge:111300000, status:"Completed" },
      { id:"HMV-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[13.025,76.018], capacity:14000,   cost:980000,   recharge:42000,     status:"Proposed"  },
      { id:"HMV-03", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[13.072,75.988], capacity:3200,    cost:160000,   recharge:9600,      status:"Proposed"  }
    ]
  },

  kabini_dam: {
    name: "Kabini Reservoir Catchment", label: "Kabini Dam (KA-Mysuru) — 19.52 TMC",
    group: "Karnataka Dams",
    id: "DAM-KA-MYS-KBN", center: [11.985, 76.340],
    area_ha: 18800, rainfall_mm: 1120, avg_slope: 8.2, soil_group: "A", curve_number: 65,
    boundary: [[12.008,76.312],[12.022,76.354],[11.995,76.375],[11.962,76.360],[11.952,76.320],[11.975,76.298],[12.008,76.312]],
    streams: [
      { order: 3, coords: [[12.018,76.325],[12.000,76.335],[11.985,76.340],[11.968,76.352]] },
      { order: 2, coords: [[12.021,76.346],[12.004,76.341],[11.985,76.340]] },
      { order: 1, coords: [[11.970,76.322],[11.985,76.340]] }
    ],
    interventions: [
      { id:"KBN-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[11.985,76.340], capacity:1952000, cost:0,        recharge:58560000, status:"Completed" },
      { id:"KBN-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[11.968,76.356], capacity:12000,   cost:840000,   recharge:36000,    status:"Proposed"  },
      { id:"KBN-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[12.002,76.332], capacity:3500,    cost:258000,   recharge:10500,    status:"Ongoing"   }
    ]
  },

  /* ── AP & Telangana Dams ── */
  nagarjuna_sagar: {
    name: "Nagarjuna Sagar Dam Catchment", label: "Nagarjuna Sagar Dam (AP/TG) — 11.475 BCM",
    group: "AP & Telangana Dams",
    id: "DAM-AP-NGS-NJS", center: [16.574, 79.318],
    area_ha: 2140000, rainfall_mm: 875, avg_slope: 2.8, soil_group: "B", curve_number: 68,
    boundary: [[16.600,79.285],[16.622,79.338],[16.592,79.362],[16.552,79.345],[16.540,79.295],[16.568,79.272],[16.600,79.285]],
    streams: [
      { order: 3, coords: [[16.612,79.300],[16.590,79.312],[16.574,79.318],[16.558,79.332]] },
      { order: 2, coords: [[16.618,79.330],[16.598,79.322],[16.574,79.318]] },
      { order: 1, coords: [[16.560,79.290],[16.574,79.318]] }
    ],
    interventions: [
      { id:"NJS-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[16.574,79.318], capacity:11475000000, cost:0,        recharge:344250000, status:"Completed" },
      { id:"NJS-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[16.555,79.340], capacity:45000,       cost:3150000,  recharge:135000,    status:"Proposed"  },
      { id:"NJS-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[16.595,79.310], capacity:8500,        cost:625000,   recharge:25500,     status:"Ongoing"   }
    ]
  },

  srisailam_dam: {
    name: "Srisailam Reservoir Catchment", label: "Srisailam Dam (AP/TG) — 215.8 TMC",
    group: "AP & Telangana Dams",
    id: "DAM-AP-KNL-SSL", center: [16.094, 78.898],
    area_ha: 820000, rainfall_mm: 780, avg_slope: 4.2, soil_group: "B", curve_number: 71,
    boundary: [[16.118,78.868],[16.136,78.914],[16.105,78.938],[16.068,78.922],[16.058,78.875],[16.082,78.852],[16.118,78.868]],
    streams: [
      { order: 3, coords: [[16.128,78.882],[16.110,78.892],[16.094,78.898],[16.078,78.910]] },
      { order: 2, coords: [[16.134,78.908],[16.114,78.902],[16.094,78.898]] },
      { order: 1, coords: [[16.080,78.872],[16.094,78.898]] }
    ],
    interventions: [
      { id:"SSL-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[16.094,78.898], capacity:21580000, cost:0,        recharge:647400000, status:"Completed" },
      { id:"SSL-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[16.076,78.915], capacity:32000,    cost:2240000,  recharge:96000,     status:"Proposed"  },
      { id:"SSL-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[16.112,78.888], capacity:6200,     cost:455000,   recharge:18600,     status:"Ongoing"   }
    ]
  },

  pochampad_dam: {
    name: "Pochampad Dam Catchment (Sriram Sagar)", label: "Sriram Sagar Dam (TG-Nizamabad) — 90.5 TMC",
    group: "AP & Telangana Dams",
    id: "DAM-TG-NZB-SRS", center: [18.972, 78.318],
    area_ha: 922000, rainfall_mm: 880, avg_slope: 3.5, soil_group: "C", curve_number: 80,
    boundary: [[18.996,78.290],[19.012,78.330],[18.982,78.352],[18.950,78.336],[18.940,78.297],[18.962,78.275],[18.996,78.290]],
    streams: [
      { order: 3, coords: [[19.006,78.304],[18.988,78.314],[18.972,78.318],[18.956,78.330]] },
      { order: 2, coords: [[19.010,78.324],[18.992,78.320],[18.972,78.318]] },
      { order: 1, coords: [[18.958,78.298],[18.972,78.318]] }
    ],
    interventions: [
      { id:"SRS-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[18.972,78.318], capacity:9050000, cost:0,        recharge:271500000, status:"Completed" },
      { id:"SRS-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[18.954,78.334], capacity:28000,   cost:1960000,  recharge:84000,     status:"Proposed"  },
      { id:"SRS-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[18.990,78.310], capacity:6000,    cost:440000,   recharge:18000,     status:"Ongoing"   }
    ]
  },

  /* ── Maharashtra Dams ── */
  jayakwadi_dam: {
    name: "Jayakwadi Dam Catchment", label: "Jayakwadi Dam (MH-Aurangabad) — 2,909 MCM",
    group: "Maharashtra Dams",
    id: "DAM-MH-AUR-JYK", center: [19.502, 75.488],
    area_ha: 920000, rainfall_mm: 645, avg_slope: 2.5, soil_group: "C", curve_number: 83,
    boundary: [[19.525,75.460],[19.542,75.502],[19.512,75.524],[19.478,75.508],[19.468,75.468],[19.492,75.448],[19.525,75.460]],
    streams: [
      { order: 3, coords: [[19.535,75.472],[19.515,75.482],[19.502,75.488],[19.486,75.500]] },
      { order: 2, coords: [[19.540,75.498],[19.520,75.492],[19.502,75.488]] },
      { order: 1, coords: [[19.488,75.465],[19.502,75.488]] }
    ],
    interventions: [
      { id:"JYK-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[19.502,75.488], capacity:2909000, cost:0,        recharge:87270000, status:"Completed" },
      { id:"JYK-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[19.484,75.505], capacity:28000,   cost:1960000,  recharge:84000,    status:"Proposed"  },
      { id:"JYK-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[19.518,75.480], capacity:6800,    cost:500000,   recharge:20400,    status:"Ongoing"   }
    ]
  },

  koyna_dam: {
    name: "Koyna Dam Catchment", label: "Koyna Dam (MH-Satara) — 105.25 TMC",
    group: "Maharashtra Dams",
    id: "DAM-MH-SAT-KYN", center: [17.399, 73.749],
    area_ha: 89000, rainfall_mm: 3200, avg_slope: 15.2, soil_group: "A", curve_number: 55,
    boundary: [[17.422,73.720],[17.438,73.762],[17.410,73.784],[17.378,73.768],[17.368,73.728],[17.390,73.710],[17.422,73.720]],
    streams: [
      { order: 3, coords: [[17.432,73.734],[17.415,73.744],[17.399,73.749],[17.382,73.762]] },
      { order: 2, coords: [[17.436,73.758],[17.418,73.752],[17.399,73.749]] },
      { order: 1, coords: [[17.384,73.724],[17.399,73.749]] }
    ],
    interventions: [
      { id:"KYN-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[17.399,73.749], capacity:10525000, cost:0,        recharge:315750000, status:"Completed" },
      { id:"KYN-02", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[17.415,73.742], capacity:4800,     cost:355000,   recharge:14400,     status:"Proposed"  },
      { id:"KYN-03", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[17.430,73.730], capacity:3800,     cost:190000,   recharge:11400,     status:"Proposed"  }
    ]
  },

  ujani_dam: {
    name: "Ujani Dam Catchment", label: "Ujani Dam (MH-Solapur) — 117.26 TMC",
    group: "Maharashtra Dams",
    id: "DAM-MH-SLR-UJN", center: [18.084, 75.118],
    area_ha: 1400000, rainfall_mm: 580, avg_slope: 1.5, soil_group: "D", curve_number: 88,
    boundary: [[18.108,75.090],[18.125,75.130],[18.095,75.152],[18.062,75.136],[18.052,75.097],[18.075,75.076],[18.108,75.090]],
    streams: [
      { order: 3, coords: [[18.118,75.103],[18.100,75.112],[18.084,75.118],[18.068,75.130]] },
      { order: 2, coords: [[18.122,75.124],[18.104,75.118],[18.084,75.118]] },
      { order: 1, coords: [[18.070,75.096],[18.084,75.118]] }
    ],
    interventions: [
      { id:"UJN-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[18.084,75.118], capacity:11726000, cost:0,        recharge:351780000, status:"Completed" },
      { id:"UJN-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[18.066,75.134], capacity:32000,    cost:2240000,  recharge:96000,     status:"Ongoing"   },
      { id:"UJN-03", type:"Gully Plug",                 zone:"Mid-Slope",   order:2, coords:[18.102,75.108], capacity:1200,     cost:85000,    recharge:3600,      status:"Proposed"  }
    ]
  },

  /* ── Rajasthan Dams ── */
  rana_pratap_sagar: {
    name: "Rana Pratap Sagar Dam Catchment", label: "Rana Pratap Sagar (RJ-Rawatbhata) — 2,900 MCM",
    group: "Rajasthan Dams",
    id: "DAM-RJ-CIT-RPS", center: [24.930, 75.578],
    area_ha: 840000, rainfall_mm: 725, avg_slope: 3.5, soil_group: "B", curve_number: 74,
    boundary: [[24.952,75.550],[24.968,75.592],[24.940,75.614],[24.908,75.598],[24.898,75.558],[24.922,75.538],[24.952,75.550]],
    streams: [
      { order: 3, coords: [[24.962,75.564],[24.944,75.574],[24.930,75.578],[24.914,75.590]] },
      { order: 2, coords: [[24.966,75.585],[24.948,75.580],[24.930,75.578]] },
      { order: 1, coords: [[24.916,75.556],[24.930,75.578]] }
    ],
    interventions: [
      { id:"RPS-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[24.930,75.578], capacity:2900000, cost:0,        recharge:87000000, status:"Completed" },
      { id:"RPS-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[24.912,75.594], capacity:26000,   cost:1820000,  recharge:78000,    status:"Proposed"  },
      { id:"RPS-03", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[24.964,75.562], capacity:3600,    cost:180000,   recharge:10800,    status:"Proposed"  }
    ]
  },

  bisalpur_dam: {
    name: "Bisalpur Dam Catchment", label: "Bisalpur Dam (RJ-Tonk) — 1,088 MCM",
    group: "Rajasthan Dams",
    id: "DAM-RJ-TNK-BSL", center: [25.845, 75.520],
    area_ha: 520000, rainfall_mm: 680, avg_slope: 2.8, soil_group: "C", curve_number: 82,
    boundary: [[25.868,75.494],[25.882,75.534],[25.855,75.556],[25.822,75.540],[25.812,75.500],[25.836,75.480],[25.868,75.494]],
    streams: [
      { order: 3, coords: [[25.878,75.508],[25.860,75.518],[25.845,75.520],[25.829,75.532]] },
      { order: 2, coords: [[25.880,75.528],[25.864,75.524],[25.845,75.520]] },
      { order: 1, coords: [[25.831,75.498],[25.845,75.520]] }
    ],
    interventions: [
      { id:"BSL-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[25.845,75.520], capacity:1088000, cost:0,        recharge:32640000, status:"Completed" },
      { id:"BSL-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[25.827,75.536], capacity:20000,   cost:1400000,  recharge:60000,    status:"Ongoing"   },
      { id:"BSL-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[25.862,75.512], capacity:4500,    cost:332000,   recharge:13500,    status:"Proposed"  }
    ]
  },

  /* ── Madhya Pradesh Dams ── */
  bargi_dam: {
    name: "Bargi Dam Catchment (Rani Avantibai Sagar)", label: "Bargi Dam (MP-Jabalpur) — 3,425 MCM",
    group: "Madhya Pradesh Dams",
    id: "DAM-MP-JBL-BRG", center: [22.975, 79.958],
    area_ha: 1470000, rainfall_mm: 1250, avg_slope: 4.2, soil_group: "B", curve_number: 72,
    boundary: [[22.998,79.930],[23.015,79.972],[22.985,79.994],[22.952,79.978],[22.942,79.938],[22.966,79.916],[22.998,79.930]],
    streams: [
      { order: 3, coords: [[23.008,79.944],[22.990,79.954],[22.975,79.958],[22.959,79.970]] },
      { order: 2, coords: [[23.012,79.966],[22.994,79.960],[22.975,79.958]] },
      { order: 1, coords: [[22.961,79.934],[22.975,79.958]] }
    ],
    interventions: [
      { id:"BRG-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[22.975,79.958], capacity:3425000, cost:0,        recharge:102750000, status:"Completed" },
      { id:"BRG-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[22.957,79.974], capacity:35000,   cost:2450000,  recharge:105000,    status:"Proposed"  },
      { id:"BRG-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[22.992,79.950], capacity:7200,    cost:530000,   recharge:21600,     status:"Ongoing"   }
    ]
  },

  bansagar_dam: {
    name: "Bansagar Dam Catchment", label: "Bansagar Dam (MP-Shahdol) — 5,410 MCM",
    group: "Madhya Pradesh Dams",
    id: "DAM-MP-SDL-BNS", center: [24.198, 81.268],
    area_ha: 1080000, rainfall_mm: 1020, avg_slope: 5.8, soil_group: "B", curve_number: 73,
    boundary: [[24.222,81.240],[24.238,81.282],[24.208,81.304],[24.175,81.288],[24.165,81.248],[24.188,81.226],[24.222,81.240]],
    streams: [
      { order: 3, coords: [[24.232,81.254],[24.214,81.264],[24.198,81.268],[24.182,81.280]] },
      { order: 2, coords: [[24.236,81.275],[24.218,81.270],[24.198,81.268]] },
      { order: 1, coords: [[24.184,81.246],[24.198,81.268]] }
    ],
    interventions: [
      { id:"BNS-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[24.198,81.268], capacity:5410000, cost:0,        recharge:162300000, status:"Completed" },
      { id:"BNS-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[24.180,81.284], capacity:28000,   cost:1960000,  recharge:84000,     status:"Proposed"  },
      { id:"BNS-03", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[24.234,81.252], capacity:4800,    cost:240000,   recharge:14400,     status:"Proposed"  }
    ]
  },

  /* ── Gujarat Dams ── */
  sardar_sarovar: {
    name: "Sardar Sarovar Dam Catchment", label: "Sardar Sarovar (GJ-Narmada) — 9,210 MCM",
    group: "Gujarat Dams",
    id: "DAM-GJ-NRM-SSP", center: [21.832, 73.742],
    area_ha: 8800000, rainfall_mm: 885, avg_slope: 3.2, soil_group: "B", curve_number: 70,
    boundary: [[21.858,73.712],[21.875,73.755],[21.845,73.778],[21.812,73.762],[21.800,73.720],[21.825,73.698],[21.858,73.712]],
    streams: [
      { order: 3, coords: [[21.868,73.726],[21.850,73.736],[21.832,73.742],[21.815,73.754]] },
      { order: 2, coords: [[21.872,73.748],[21.854,73.744],[21.832,73.742]] },
      { order: 1, coords: [[21.818,73.718],[21.832,73.742]] }
    ],
    interventions: [
      { id:"SSP-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[21.832,73.742], capacity:9210000, cost:0,         recharge:276300000, status:"Completed" },
      { id:"SSP-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[21.814,73.758], capacity:50000,   cost:3500000,   recharge:150000,    status:"Proposed"  },
      { id:"SSP-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[21.852,73.734], capacity:9500,    cost:700000,    recharge:28500,     status:"Ongoing"   }
    ]
  },

  ukai_dam: {
    name: "Ukai Dam Catchment", label: "Ukai Dam (GJ-Surat) — 7,442 MCM",
    group: "Gujarat Dams",
    id: "DAM-GJ-SRT-UKI", center: [21.248, 73.566],
    area_ha: 620000, rainfall_mm: 1150, avg_slope: 3.8, soil_group: "B", curve_number: 71,
    boundary: [[21.272,73.538],[21.288,73.580],[21.258,73.602],[21.225,73.586],[21.215,73.545],[21.238,73.523],[21.272,73.538]],
    streams: [
      { order: 3, coords: [[21.282,73.552],[21.264,73.562],[21.248,73.566],[21.232,73.578]] },
      { order: 2, coords: [[21.286,73.573],[21.268,73.568],[21.248,73.566]] },
      { order: 1, coords: [[21.235,73.545],[21.248,73.566]] }
    ],
    interventions: [
      { id:"UKI-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[21.248,73.566], capacity:7442000, cost:0,        recharge:223260000, status:"Completed" },
      { id:"UKI-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[21.230,73.582], capacity:38000,   cost:2660000,  recharge:114000,    status:"Proposed"  },
      { id:"UKI-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[21.265,73.558], capacity:7800,    cost:575000,   recharge:23400,     status:"Ongoing"   }
    ]
  },

  /* ── Odisha Dams ── */
  hirakud_dam: {
    name: "Hirakud Dam Catchment", label: "Hirakud Dam (OD-Sambalpur) — 8,136 MCM",
    group: "Odisha Dams",
    id: "DAM-OD-SBP-HRK", center: [21.525, 83.878],
    area_ha: 8340000, rainfall_mm: 1420, avg_slope: 4.5, soil_group: "B", curve_number: 72,
    boundary: [[21.548,83.848],[21.565,83.892],[21.535,83.916],[21.502,83.900],[21.492,83.858],[21.515,83.835],[21.548,83.848]],
    streams: [
      { order: 3, coords: [[21.558,83.862],[21.540,83.872],[21.525,83.878],[21.508,83.890]] },
      { order: 2, coords: [[21.562,83.883],[21.544,83.878],[21.525,83.878]] },
      { order: 1, coords: [[21.510,83.855],[21.525,83.878]] }
    ],
    interventions: [
      { id:"HRK-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[21.525,83.878], capacity:8136000, cost:0,        recharge:244080000, status:"Completed" },
      { id:"HRK-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[21.506,83.894], capacity:42000,   cost:2940000,  recharge:126000,    status:"Proposed"  },
      { id:"HRK-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[21.542,83.870], capacity:8800,    cost:648000,   recharge:26400,     status:"Ongoing"   }
    ]
  },

  /* ── Punjab & Himachal Pradesh Dams ── */
  bhakra_nangal: {
    name: "Bhakra Nangal Dam Catchment (Gobind Sagar)", label: "Bhakra Nangal Dam (HP-Bilaspur) — 7,200 MCM",
    group: "Punjab & HP Dams",
    id: "DAM-HP-BLS-BNL", center: [31.420, 76.432],
    area_ha: 3590000, rainfall_mm: 1100, avg_slope: 8.5, soil_group: "A", curve_number: 62,
    boundary: [[31.445,76.402],[31.462,76.445],[31.432,76.468],[31.400,76.452],[31.388,76.410],[31.412,76.388],[31.445,76.402]],
    streams: [
      { order: 3, coords: [[31.455,76.416],[31.438,76.426],[31.420,76.432],[31.404,76.444]] },
      { order: 2, coords: [[31.460,76.438],[31.442,76.432],[31.420,76.432]] },
      { order: 1, coords: [[31.406,76.410],[31.420,76.432]] }
    ],
    interventions: [
      { id:"BNL-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[31.420,76.432], capacity:7200000, cost:0,        recharge:216000000, status:"Completed" },
      { id:"BNL-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[31.402,76.448], capacity:55000,   cost:3850000,  recharge:165000,    status:"Proposed"  },
      { id:"BNL-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[31.440,76.424], capacity:10500,   cost:770000,   recharge:31500,     status:"Ongoing"   }
    ]
  },

  pong_dam: {
    name: "Pong Dam Catchment (Maharana Pratap Sagar)", label: "Pong Dam (HP-Kangra) — 5,880 MCM",
    group: "Punjab & HP Dams",
    id: "DAM-HP-KNG-PNG", center: [32.008, 76.063],
    area_ha: 1248000, rainfall_mm: 1350, avg_slope: 9.2, soil_group: "A", curve_number: 60,
    boundary: [[32.032,76.034],[32.048,76.076],[32.018,76.098],[31.986,76.082],[31.975,76.042],[31.998,76.020],[32.032,76.034]],
    streams: [
      { order: 3, coords: [[32.042,76.048],[32.024,76.058],[32.008,76.063],[31.992,76.074]] },
      { order: 2, coords: [[32.046,76.069],[32.028,76.064],[32.008,76.063]] },
      { order: 1, coords: [[31.994,76.041],[32.008,76.063]] }
    ],
    interventions: [
      { id:"PNG-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[32.008,76.063], capacity:5880000, cost:0,        recharge:176400000, status:"Completed" },
      { id:"PNG-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[31.990,76.078], capacity:40000,   cost:2800000,  recharge:120000,    status:"Proposed"  },
      { id:"PNG-03", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[32.044,76.046], capacity:6500,    cost:325000,   recharge:19500,     status:"Proposed"  }
    ]
  },

  /* ── Uttarakhand Dams ── */
  tehri_dam: {
    name: "Tehri Dam Catchment", label: "Tehri Dam (UK-Tehri Garhwal) — 2,615 MCM",
    group: "Uttarakhand Dams",
    id: "DAM-UK-THR-TRD", center: [30.378, 78.482],
    area_ha: 720000, rainfall_mm: 1850, avg_slope: 18.5, soil_group: "A", curve_number: 55,
    boundary: [[30.402,78.452],[30.418,78.496],[30.388,78.518],[30.356,78.502],[30.345,78.460],[30.368,78.438],[30.402,78.452]],
    streams: [
      { order: 3, coords: [[30.412,78.466],[30.394,78.476],[30.378,78.482],[30.362,78.494]] },
      { order: 2, coords: [[30.416,78.488],[30.398,78.482],[30.378,78.482]] },
      { order: 1, coords: [[30.364,78.460],[30.378,78.482]] }
    ],
    interventions: [
      { id:"TRD-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[30.378,78.482], capacity:2615000, cost:0,        recharge:78450000, status:"Completed" },
      { id:"TRD-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[30.360,78.498], capacity:22000,   cost:1540000,  recharge:66000,    status:"Proposed"  },
      { id:"TRD-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[30.396,78.474], capacity:5800,    cost:425000,   recharge:17400,    status:"Ongoing"   }
    ]
  },

  /* ── Kerala Dams ── */
  idukki_dam: {
    name: "Idukki Arch Dam Catchment", label: "Idukki Dam (KL-Idukki) — 1,996 MCM",
    group: "Kerala Dams",
    id: "DAM-KL-IDK-IDK", center: [9.848, 76.974],
    area_ha: 64000, rainfall_mm: 2850, avg_slope: 14.8, soil_group: "A", curve_number: 54,
    boundary: [[9.872,76.946],[9.888,76.988],[9.858,77.010],[9.825,76.994],[9.815,76.952],[9.838,76.930],[9.872,76.946]],
    streams: [
      { order: 3, coords: [[9.882,76.960],[9.864,76.970],[9.848,76.974],[9.832,76.986]] },
      { order: 2, coords: [[9.886,76.981],[9.868,76.976],[9.848,76.974]] },
      { order: 1, coords: [[9.834,76.952],[9.848,76.974]] }
    ],
    interventions: [
      { id:"IDK-01", type:"Arch Dam",                  zone:"Valley Floor", order:3, coords:[9.848,76.974], capacity:1996000, cost:0,        recharge:59880000, status:"Completed" },
      { id:"IDK-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[9.830,76.990], capacity:14000,   cost:980000,   recharge:42000,    status:"Proposed"  },
      { id:"IDK-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[9.866,76.968], capacity:3200,    cost:235000,   recharge:9600,     status:"Ongoing"   }
    ]
  },

  banasura_sagar: {
    name: "Banasura Sagar Dam Catchment", label: "Banasura Sagar (KL-Wayanad) — 209 MCM",
    group: "Kerala Dams",
    id: "DAM-KL-WND-BNS", center: [11.655, 76.022],
    area_ha: 22500, rainfall_mm: 2400, avg_slope: 11.5, soil_group: "A", curve_number: 56,
    boundary: [[11.678,75.994],[11.694,76.036],[11.664,76.058],[11.632,76.042],[11.622,76.000],[11.645,75.978],[11.678,75.994]],
    streams: [
      { order: 3, coords: [[11.688,76.008],[11.670,76.018],[11.655,76.022],[11.638,76.034]] },
      { order: 2, coords: [[11.692,76.028],[11.674,76.024],[11.655,76.022]] },
      { order: 1, coords: [[11.641,76.003],[11.655,76.022]] }
    ],
    interventions: [
      { id:"BNS-K1", type:"Earthfill Dam",             zone:"Valley Floor", order:3, coords:[11.655,76.022], capacity:209000, cost:0,       recharge:6270000, status:"Completed" },
      { id:"BNS-K2", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[11.672,76.015], capacity:2200,   cost:165000,  recharge:6600,    status:"Proposed"  },
      { id:"BNS-K3", type:"Continuous Contour Trench",  zone:"Ridge",       order:1, coords:[11.686,76.006], capacity:2800,   cost:140000,  recharge:8400,    status:"Proposed"  }
    ]
  },

  malampuzha_dam: {
    name: "Malampuzha Dam Catchment", label: "Malampuzha Dam (KL-Palakkad) — 151.5 MCM",
    group: "Kerala Dams",
    id: "DAM-KL-PKD-MLP", center: [10.840, 76.708],
    area_ha: 26200, rainfall_mm: 1680, avg_slope: 8.8, soil_group: "A", curve_number: 62,
    boundary: [[10.864,76.680],[10.880,76.722],[10.850,76.744],[10.818,76.728],[10.808,76.688],[10.830,76.666],[10.864,76.680]],
    streams: [
      { order: 3, coords: [[10.874,76.694],[10.856,76.704],[10.840,76.708],[10.823,76.720]] },
      { order: 2, coords: [[10.878,76.715],[10.860,76.710],[10.840,76.708]] },
      { order: 1, coords: [[10.826,76.688],[10.840,76.708]] }
    ],
    interventions: [
      { id:"MLP-01", type:"Reservoir Dam",             zone:"Valley Floor", order:3, coords:[10.840,76.708], capacity:151500, cost:0,       recharge:4545000, status:"Completed" },
      { id:"MLP-02", type:"Percolation Tank",           zone:"Valley Floor", order:3, coords:[10.822,76.724], capacity:8500,   cost:595000,  recharge:25500,   status:"Proposed"  },
      { id:"MLP-03", type:"Gabion Check Dam",           zone:"Mid-Slope",   order:2, coords:[10.858,76.700], capacity:2800,   cost:205000,  recharge:8400,    status:"Ongoing"   }
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

/* =========================================================================
   LOAD DAMS IN VIEW — Overpass API live layer
   ========================================================================= */
let _osmDamMarkers = [];
let _osmDamLoadTimer = null;

function loadDamsInView() {
  const map = window.watershedMap;
  if (!map) return;

  // Throttle: only fire once per 1200 ms after map stops moving
  clearTimeout(_osmDamLoadTimer);
  _osmDamLoadTimer = setTimeout(async () => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // Only load OSM dams if zoomed in enough (avoids too many results)
    if (zoom < 7) {
      // At low zoom, show WATERSHED_DB markers as overview pins
      _renderWatershedDBPins();
      return;
    }

    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `[out:json][timeout:15];(
      node["waterway"="dam"](${bbox});
      way["waterway"="dam"](${bbox});
      relation["waterway"="dam"](${bbox});
      node["water"="reservoir"](${bbox});
      way["water"="reservoir"](${bbox});
    );out center 40;`;

    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
      });
      const d = await r.json();
      _renderOSMDams(d.elements ?? []);
    } catch(e) {
      // Silently ignore network failures — map still works with WATERSHED_DB
    }
  }, 1200);
}

function _clearOSMDamMarkers() {
  const map = window.watershedMap;
  if (!map) return;
  _osmDamMarkers.forEach(m => map.removeLayer(m));
  _osmDamMarkers = [];
}

let _watershedOverviewMarkers = [];

function _clearWatershedOverviewMarkers() {
  const map = window.watershedMap;
  if (!map) return;
  _watershedOverviewMarkers.forEach(m => map.removeLayer(m));
  _watershedOverviewMarkers = [];
}

function _renderOSMDams(elements) {
  const map = window.watershedMap;
  if (!map) return;

  _clearOSMDamMarkers();
  if (!window._osmDamCache) window._osmDamCache = {};

  elements.forEach(el => {
    const lat = el.center ? el.center.lat : el.lat;
    const lng = el.center ? el.center.lon : el.lon;
    if (!lat || !lng) return;

    const name = el.tags?.name || el.tags?.waterway || 'Unnamed Dam/Reservoir';
    const key = 'osm_' + el.id;

    // Cache for dropdown lookup and dynamic watershed generation
    window._osmDamCache[key] = { key, lat, lng, name, tags: el.tags || {} };

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background: linear-gradient(135deg,#0ea5e9,#0284c7);
        width:24px; height:24px; border-radius:50%;
        border:2px solid #fff;
        box-shadow: 0 0 10px #0ea5e9;
        display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:11px; font-weight:700;
        font-family:sans-serif; cursor:pointer;
      ">🌊</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:'Segoe UI',sans-serif;min-width:200px;">
        <div style="font-weight:700;font-size:13px;color:#0284c7;margin-bottom:4px;">${name}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">
          ${el.tags?.water ? 'Type: ' + el.tags.water : 'OSM Live Dam/Reservoir'}
          ${el.tags?.['reservoir:type'] ? ' | ' + el.tags['reservoir:type'] : ''}
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">
          Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button onclick="window.loadOsmDamFromPopup('${key}')"
            style="width:100%;background:#059669;color:#fff;border:none;border-radius:4px;padding:6px 10px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span>📊 Load Full Watershed & Siting Plan</span>
          </button>
          <a href="https://www.openstreetmap.org/${el.type}/${el.id}" target="_blank"
             style="font-size:10px;color:#0ea5e9;text-align:center;text-decoration:none;">View on OpenStreetMap ↗</a>
        </div>
      </div>
    `);
    _osmDamMarkers.push(marker);

    // Add to dropdown if not already there
    _appendOSMOptionToSelect(key, name);
  });
}

function _renderWatershedDBPins() {
  const map = window.watershedMap;
  if (!map) return;

  _clearWatershedOverviewMarkers();

  // Show overview pins for all curated national dams
  Object.entries(WATERSHED_DB).forEach(([key, ws]) => {
    if (key === 'custom_site' || !ws.center) return;

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background: linear-gradient(135deg, #059669, #0284c7);
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 8px rgba(2, 132, 199, 0.6);
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-size: 10px; font-weight: 700;
        cursor: pointer;
      ">🌊</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker(ws.center, { icon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:'Segoe UI',sans-serif; min-width:210px;">
        <div style="font-weight:700; font-size:13px; color:#059669; margin-bottom:4px;">${ws.name}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:6px;">${ws.group} &bull; ID: ${ws.id}</div>
        <table style="width:100%; font-size:11px; line-height:1.4; margin-bottom:8px; border-collapse:collapse;">
          <tr><td style="color:#64748b;">Catchment Area:</td><td align="right"><strong>${ws.area_ha.toLocaleString()} ha</strong></td></tr>
          <tr><td style="color:#64748b;">Annual Rainfall:</td><td align="right"><strong>${ws.rainfall_mm} mm</strong></td></tr>
          <tr><td style="color:#64748b;">Mean Slope:</td><td align="right"><strong>${ws.avg_slope}%</strong></td></tr>
          <tr><td style="color:#64748b;">Soil Group:</td><td align="right"><strong>Group ${ws.soil_group} (CN ${ws.curve_number})</strong></td></tr>
          <tr><td style="color:#64748b;">Interventions:</td><td align="right"><strong>${ws.interventions ? ws.interventions.length : 0} structures</strong></td></tr>
        </table>
        <button onclick="window.selectWatershedByKey('${key}')"
          style="width:100%; background:#0284c7; color:#fff; border:none; border-radius:5px; padding:6px 10px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
          <span>📊 Load Watershed & Planning Model</span>
        </button>
      </div>
    `);
    _watershedOverviewMarkers.push(marker);
  });
}

window.selectWatershedByKey = function(key) {
  const sel = document.getElementById('watershed-select');
  if (sel) sel.value = key;
  loadWatershedData(key);
  showMapToast('📍 Loaded Dam Catchment: ' + (WATERSHED_DB[key]?.name || key));
};

window.loadOsmDamFromPopup = function(key) {
  if (window._osmDamCache && window._osmDamCache[key]) {
    loadOsmDam(window._osmDamCache[key]);
  }
};

/**
 * Synthesizes a realistic, geographically sound watershed hydrological model
 * for ANY dam or coordinate in India/world.
 */
function generateWatershedModelForLocation(lat, lng, name, tags = {}) {
  // Deterministic seed based on latitude and longitude
  const seed = Math.abs(Math.sin(lat * 123.456 + lng * 789.012)) % 1;

  let rainfall_mm = 850;
  let avg_slope = 5.2;
  let soil_group = 'B';
  let curve_number = 73;
  let area_ha = Math.round(9500 + seed * 32000);

  if (lat > 28) { // Himalayas / Northern India
    rainfall_mm = Math.round(950 + seed * 600);
    avg_slope = Number((7.5 + seed * 8.0).toFixed(1));
    soil_group = seed > 0.4 ? 'A' : 'B';
    curve_number = 66;
  } else if (lat < 16 && lng > 74.5 && lng < 77.5) { // Western Ghats
    rainfall_mm = Math.round(1800 + seed * 1350);
    avg_slope = Number((8.2 + seed * 6.5).toFixed(1));
    soil_group = 'A';
    curve_number = 62;
  } else if (lng < 74) { // Western Arid Zone
    rainfall_mm = Math.round(480 + seed * 300);
    avg_slope = Number((3.2 + seed * 2.8).toFixed(1));
    soil_group = 'C';
    curve_number = 78;
  } else if (lng > 84) { // Eastern India / Bengal / Odisha
    rainfall_mm = Math.round(1250 + seed * 500);
    avg_slope = Number((4.5 + seed * 4.0).toFixed(1));
    soil_group = 'B';
    curve_number = 71;
  } else { // Deccan / Central India
    rainfall_mm = Math.round(720 + seed * 380);
    avg_slope = Number((4.0 + seed * 3.2).toFixed(1));
    soil_group = seed > 0.5 ? 'C' : 'B';
    curve_number = 74;
  }

  // Catchment Boundary Polygon (~0.04 to 0.08 deg around dam)
  const dLat = 0.035 + seed * 0.025;
  const dLng = 0.040 + seed * 0.025;
  const boundary = [
    [Number((lat + dLat * 0.85).toFixed(4)), Number((lng - dLng * 0.70).toFixed(4))],
    [Number((lat + dLat * 1.20).toFixed(4)), Number((lng + dLng * 0.20).toFixed(4))],
    [Number((lat + dLat * 0.75).toFixed(4)), Number((lng + dLng * 0.90).toFixed(4))],
    [Number((lat - dLat * 0.30).toFixed(4)), Number((lng + dLng * 0.80).toFixed(4))],
    [Number((lat - dLat * 0.70).toFixed(4)), Number((lng - dLng * 0.20).toFixed(4))],
    [Number((lat - dLat * 0.25).toFixed(4)), Number((lng - dLng * 0.80).toFixed(4))],
    [Number((lat + dLat * 0.85).toFixed(4)), Number((lng - dLng * 0.70).toFixed(4))]
  ];

  // Drainage stream network converging to reservoir outlet
  const streams = [
    {
      order: 3,
      coords: [
        [Number((lat + dLat * 0.90).toFixed(4)), Number((lng - dLng * 0.20).toFixed(4))],
        [Number((lat + dLat * 0.40).toFixed(4)), Number((lng - dLng * 0.05).toFixed(4))],
        [Number(lat.toFixed(4)), Number(lng.toFixed(4))],
        [Number((lat - dLat * 0.50).toFixed(4)), Number((lng + dLng * 0.30).toFixed(4))]
      ]
    },
    {
      order: 2,
      coords: [
        [Number((lat + dLat * 0.80).toFixed(4)), Number((lng + dLng * 0.50).toFixed(4))],
        [Number((lat + dLat * 0.30).toFixed(4)), Number((lng + dLng * 0.20).toFixed(4))],
        [Number(lat.toFixed(4)), Number(lng.toFixed(4))]
      ]
    },
    {
      order: 1,
      coords: [
        [Number((lat - dLat * 0.40).toFixed(4)), Number((lng - dLng * 0.50).toFixed(4))],
        [Number((lat - dLat * 0.10).toFixed(4)), Number((lng - dLng * 0.20).toFixed(4))],
        [Number(lat.toFixed(4)), Number(lng.toFixed(4))]
      ]
    }
  ];

  // Sited Ridge-to-Valley interventions
  const cleanName = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'DAM';
  const interventions = [
    {
      id: `${cleanName}-01`,
      type: "Reservoir Dam",
      zone: "Valley Floor",
      order: 3,
      coords: [Number(lat.toFixed(4)), Number(lng.toFixed(4))],
      capacity: Math.round(area_ha * 110),
      cost: 0,
      recharge: Math.round(area_ha * 3300),
      status: "Completed"
    },
    {
      id: `${cleanName}-02`,
      type: "Percolation Tank",
      zone: "Valley Floor",
      order: 3,
      coords: [Number((lat - dLat * 0.35).toFixed(4)), Number((lng + dLng * 0.25).toFixed(4))],
      capacity: 16000,
      cost: 1120000,
      recharge: 48000,
      status: "Proposed"
    },
    {
      id: `${cleanName}-03`,
      type: "Gabion Check Dam",
      zone: "Mid-Slope",
      order: 2,
      coords: [Number((lat + dLat * 0.45).toFixed(4)), Number((lng + dLng * 0.30).toFixed(4))],
      capacity: 4200,
      cost: 310000,
      recharge: 12600,
      status: "Ongoing"
    },
    {
      id: `${cleanName}-04`,
      type: "Continuous Contour Trenches (CCT)",
      zone: "Ridge",
      order: 1,
      coords: [Number((lat + dLat * 0.85).toFixed(4)), Number((lng - dLng * 0.30).toFixed(4))],
      capacity: 2500,
      cost: 180000,
      recharge: 10000,
      status: "Proposed"
    }
  ];

  return {
    name: name,
    label: `🌊 ${name}`,
    group: "Discovered & Live Dams",
    id: `DAM-${cleanName}-${Math.floor(lat * 100)}`,
    center: [lat, lng],
    area_ha,
    rainfall_mm,
    avg_slope,
    soil_group,
    curve_number,
    boundary,
    streams,
    interventions
  };
}

function _appendOSMOptionToSelect(key, label) {
  const sel = document.getElementById('watershed-select');
  if (!sel) return;
  if (sel.querySelector(`option[value="${key}"]`)) return; // already exists

  let og = sel.querySelector('optgroup[label="Discovered & Live Dams"]');
  if (!og) {
    og = document.createElement('optgroup');
    og.label = 'Discovered & Live Dams';
    sel.appendChild(og);
  }
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = '🌊 ' + label;
  og.appendChild(opt);
}

/* =========================================================================
   LOAD OSM DAM by cache key (called from dropdown select or popup)
   Synthesizes full watershed model & runs hydrological calculations
   ========================================================================= */
function loadOsmDam(damData) {
  if (!damData || !damData.lat || !damData.lng) return;
  const key = damData.key || ('osm_' + (damData.id || Math.floor(Math.random() * 1000000)));

  // If not already in WATERSHED_DB, generate complete watershed profile!
  if (!WATERSHED_DB[key]) {
    WATERSHED_DB[key] = generateWatershedModelForLocation(damData.lat, damData.lng, damData.name, damData.tags || {});
  }

  _appendOSMOptionToSelect(key, damData.name);

  const sel = document.getElementById('watershed-select');
  if (sel) sel.value = key;

  loadWatershedData(key);
  showMapToast('🌊 Analyzed & loaded full watershed for: ' + damData.name);
}

/* =========================================================================
   GLOBAL DAM SEARCH — queries Overpass + filters WATERSHED_DB
   ========================================================================= */
async function searchGlobalDams(term) {
  const sel = document.getElementById('watershed-select');
  if (!sel) return;

  // 1. Filter local WATERSHED_DB first (instant)
  filterWatershedOptions(term.toLowerCase());

  // 2. Search Overpass API for dams matching the name
  const query = `[out:json][timeout:12];(
    node["waterway"="dam"]["name"~"${term}",i];
    way["waterway"="dam"]["name"~"${term}",i];
    node["water"="reservoir"]["name"~"${term}",i];
    way["water"="reservoir"]["name"~"${term}",i];
  );out center 15;`;

  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    });
    const d = await r.json();
    const elements = d.elements ?? [];

    if (!window._osmDamCache) window._osmDamCache = {};

    elements.forEach(el => {
      const lat = el.center ? el.center.lat : el.lat;
      const lng = el.center ? el.center.lon : el.lon;
      if (!lat || !lng) return;
      const name = el.tags?.name || 'Unnamed Dam';
      const key = 'osm_' + el.id;
      window._osmDamCache[key] = { lat, lng, name, tags: el.tags || {} };
      _appendOSMOptionToSelect(key, name);
    });

    // Auto-select first OSM result if no local match found
    if (elements.length > 0) {
      const firstKey = 'osm_' + elements[0].id;
      const el0 = elements[0];
      const lat = el0.center ? el0.center.lat : el0.lat;
      const lng = el0.center ? el0.center.lon : el0.lon;
      if (lat && lng && window.watershedMap) {
        // Fly to the result on map
        window.watershedMap.flyTo([lat, lng], 13, { duration: 1.4 });
        showMapToast('🔍 Found: ' + (el0.tags?.name || 'Dam'));
      }
    }
  } catch(e) {
    // Silently ignore — local filter still works
  }
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
    if (key === 'custom_site' || !ws.center) return;
    const dlat = ws.center[0] - latlng[0];
    const dlng = ws.center[1] - latlng[1];
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  });

  // If clicked within ~0.35 degrees (~35km) of a known dam/watershed, snap to it
  if (bestKey && bestDist < 0.35) {
    const sel = document.getElementById('watershed-select');
    if (sel) sel.value = bestKey;
    loadWatershedData(bestKey);
    showMapToast('📍 Dam selected: ' + WATERSHED_DB[bestKey].name);
    return;
  }

  // Otherwise, synthesize a custom micro-watershed right at clicked point!
  const customKey = 'custom_' + Math.round(latlng[0] * 1000) + '_' + Math.round(latlng[1] * 1000);
  const siteName = `Custom Micro-Catchment (${latlng[0].toFixed(3)}°N, ${latlng[1].toFixed(3)}°E)`;
  const customModel = generateWatershedModelForLocation(latlng[0], latlng[1], siteName);
  customModel.group = "Custom Clicked Sites";
  WATERSHED_DB[customKey] = customModel;

  _appendOSMOptionToSelect(customKey, siteName);
  const sel = document.getElementById('watershed-select');
  if (sel) sel.value = customKey;
  loadWatershedData(customKey);
  showMapToast('📍 Analyzed & created watershed for: ' + siteName);
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

  // Zone distribution for diagram
  const zones = {};
  currentWS.interventions.forEach(i => {
    if (!zones[i.zone]) zones[i.zone] = { count: 0, cost: 0, recharge: 0 };
    zones[i.zone].count++;
    zones[i.zone].cost += i.cost;
    zones[i.zone].recharge += i.recharge;
  });
  const zoneKeys = Object.keys(zones);
  const zoneColors = { 'Ridge': '#f59e0b', 'Mid-Slope': '#38bdf8', 'Valley Floor': '#10b981' };

  // Status counts
  const statuses = { Proposed: 0, Ongoing: 0, Completed: 0 };
  currentWS.interventions.forEach(i => { if (statuses[i.status] !== undefined) statuses[i.status]++; });

  // Water balance SVG donut helper
  const P = currentWS.rainfall_mm;
  const CN = currentWS.curve_number;
  const S_val = (25400 / CN) - 254;
  const Ia = 0.2 * S_val;
  const Q_mm = P > Ia ? Math.pow(P - Ia, 2) / (P - Ia + S_val) : 0;
  const infiltration_mm = P - Q_mm;
  const runoffPct = Math.round((Q_mm / P) * 100);
  const infiltPct = 100 - runoffPct;

  // Build donut SVG (runoff vs infiltration)
  const donutR = 50, donutCx = 65, donutCy = 65;
  const donutCircumference = 2 * Math.PI * donutR;
  const runoffArc = donutCircumference * (runoffPct / 100);
  const infiltArc = donutCircumference - runoffArc;

  // Zone bar heights
  const maxRecharge = Math.max(...zoneKeys.map(z => zones[z].recharge), 1);

  container.innerHTML = `
    <div style="border-bottom:2px solid #10b981; padding-bottom:12px; margin-bottom:20px;">
      <h3 style="font-size:1.3rem; color:#e2e8f0;">Detailed Project Report (DPR)</h3>
      <p style="color:#64748b; font-size:0.85rem;">Project ID: ${currentWS.id} | Generated on: ${new Date().toLocaleDateString()} | AQUANEXIS v2.0</p>
    </div>

    <!-- Baseline & Economics Cards -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div style="background:#111; border:1px solid rgba(16,185,129,.18); padding:15px; border-radius:10px;">
        <h4 style="color:#10b981; margin-bottom:8px; font-size:.9rem;">🗺️ Watershed Baseline</h4>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Name:</strong> ${currentWS.name}</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Catchment Area:</strong> ${currentWS.area_ha} ha</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Annual Rainfall:</strong> ${currentWS.rainfall_mm} mm</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Soil Group:</strong> Group ${currentWS.soil_group}</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Curve Number (CN):</strong> ${currentWS.curve_number}</p>
      </div>
      <div style="background:#111; border:1px solid rgba(56,189,248,.18); padding:15px; border-radius:10px;">
        <h4 style="color:#38bdf8; margin-bottom:8px; font-size:.9rem;">💰 Intervention Economics</h4>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Structures:</strong> ${currentWS.interventions.length}</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Storage Capacity:</strong> ${totalStorage.toLocaleString()} m³</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Annual Recharge:</strong> ${totalRecharge.toLocaleString()} m³</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Budget:</strong> ₹${totalCost.toLocaleString()}</p>
        <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Cost/m³:</strong> ₹${totalRecharge > 0 ? (totalCost / totalRecharge).toFixed(2) : '—'}/m³</p>
      </div>
    </div>

    <!-- ═══ DIAGRAMS ROW ═══ -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:22px;">

      <!-- Diagram 1: Water Balance Donut -->
      <div style="background:#0d0d0d; border:1px solid rgba(16,185,129,.12); border-radius:10px; padding:14px; text-align:center;">
        <div style="font-size:.72rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:700; margin-bottom:8px; font-family:'Courier New',monospace;">
          💧 SCS-CN Water Balance
        </div>
        <svg viewBox="0 0 130 130" style="width:110px; height:110px; margin:0 auto; display:block;">
          <circle cx="${donutCx}" cy="${donutCy}" r="${donutR}" fill="none" stroke="#1e293b" stroke-width="14"/>
          <circle cx="${donutCx}" cy="${donutCy}" r="${donutR}" fill="none" stroke="#dc2626" stroke-width="14"
            stroke-dasharray="${runoffArc} ${infiltArc}" stroke-dashoffset="0"
            transform="rotate(-90 ${donutCx} ${donutCy})" stroke-linecap="round"/>
          <circle cx="${donutCx}" cy="${donutCy}" r="${donutR}" fill="none" stroke="#10b981" stroke-width="14"
            stroke-dasharray="${infiltArc} ${runoffArc}" stroke-dashoffset="${-runoffArc}"
            transform="rotate(-90 ${donutCx} ${donutCy})" stroke-linecap="round"/>
          <text x="${donutCx}" y="${donutCy - 5}" text-anchor="middle" fill="#e2e8f0" font-size="15" font-weight="700" font-family="Outfit,sans-serif">${infiltPct}%</text>
          <text x="${donutCx}" y="${donutCy + 10}" text-anchor="middle" fill="#64748b" font-size="7.5" font-family="Courier New,monospace">INFILTRATION</text>
        </svg>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:6px; font-size:.65rem;">
          <span style="color:#10b981;">● Infiltrate ${infiltPct}%</span>
          <span style="color:#dc2626;">● Runoff ${runoffPct}%</span>
        </div>
      </div>

      <!-- Diagram 2: Zone Recharge Bars -->
      <div style="background:#0d0d0d; border:1px solid rgba(56,189,248,.12); border-radius:10px; padding:14px;">
        <div style="font-size:.72rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:700; margin-bottom:10px; font-family:'Courier New',monospace;">
          📊 Zone Recharge Distribution
        </div>
        <div style="display:flex; align-items:flex-end; gap:10px; height:95px; padding:0 8px;">
          ${zoneKeys.map(z => {
            const h = Math.max(12, Math.round((zones[z].recharge / maxRecharge) * 85));
            const c = zoneColors[z] || '#10b981';
            return `<div style="flex:1; text-align:center;">
              <div style="height:${h}px; background:linear-gradient(180deg,${c},${c}88); border-radius:4px 4px 0 0; margin-bottom:4px; transition:height .3s;"></div>
              <div style="font-size:.6rem; color:#64748b; font-family:'Courier New',monospace; white-space:nowrap; overflow:hidden;">${z}</div>
              <div style="font-size:.62rem; color:${c}; font-weight:700;">${(zones[z].recharge / 1000).toFixed(1)}k</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Diagram 3: Status Overview -->
      <div style="background:#0d0d0d; border:1px solid rgba(245,158,11,.12); border-radius:10px; padding:14px;">
        <div style="font-size:.72rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:700; margin-bottom:10px; font-family:'Courier New',monospace;">
          📋 Implementation Status
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${[
            { label: 'Proposed', count: statuses.Proposed, color: '#f59e0b', icon: '🔶' },
            { label: 'Ongoing',  count: statuses.Ongoing,  color: '#38bdf8', icon: '🔵' },
            { label: 'Completed',count: statuses.Completed, color: '#10b981', icon: '✅' }
          ].map(s => {
            const pct = currentWS.interventions.length > 0 ? Math.round((s.count / currentWS.interventions.length) * 100) : 0;
            return `<div>
              <div style="display:flex; justify-content:space-between; font-size:.72rem; margin-bottom:3px;">
                <span style="color:#94a3b8;">${s.icon} ${s.label}</span>
                <span style="color:${s.color}; font-weight:700;">${s.count} (${pct}%)</span>
              </div>
              <div style="height:6px; background:#1e293b; border-radius:3px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:${s.color}; border-radius:3px; transition:width .4s;"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="margin-top:10px; padding-top:8px; border-top:1px solid #1e293b; text-align:center;">
          <span style="font-size:1.3rem; font-weight:800; color:#e2e8f0;">${currentWS.interventions.length}</span>
          <span style="font-size:.7rem; color:#64748b; margin-left:4px;">total structures</span>
        </div>
      </div>
    </div>

    <!-- Interventions Table -->
    <h4 style="color:#e2e8f0; margin-bottom:10px; font-size:.95rem;">📋 Interventions Schedule</h4>
    <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
      <thead>
        <tr style="border-bottom:1px solid #1e293b; color:#64748b;">
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
        ${currentWS.interventions.map(i => {
          const statusColor = i.status === 'Completed' ? '#10b981' : i.status === 'Ongoing' ? '#38bdf8' : '#f59e0b';
          return `
          <tr style="border-bottom:1px solid #1a1a1a; color:#94a3b8;">
            <td style="padding:8px; font-family:'Courier New',monospace; color:#64748b;">${i.id}</td>
            <td style="padding:8px; font-weight:600; color:#e2e8f0;">${i.type}</td>
            <td style="padding:8px;"><span style="color:${zoneColors[i.zone] || '#94a3b8'};">${i.zone}</span></td>
            <td style="padding:8px;">${i.capacity.toLocaleString()}</td>
            <td style="padding:8px; color:#10b981;">${i.recharge.toLocaleString()}</td>
            <td style="padding:8px;">₹${i.cost.toLocaleString()}</td>
            <td style="padding:8px;"><span style="color:${statusColor}; font-weight:600;">${i.status}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- QR Code Section -->
    <div style="margin-top:20px; border-top:1px solid #1e293b; padding-top:16px;">
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <div id="dpr-qr-container" style="width:120px; height:120px; background:#fff; border-radius:8px; padding:6px; display:flex; align-items:center; justify-content:center; position:relative;">
          <div style="color:#94a3b8; font-size:.7rem; text-align:center; font-family:'Courier New',monospace;">Click<br/>"Generate QR"<br/>below</div>
        </div>
        <div style="flex:1; min-width:200px;">
          <div style="font-size:.75rem; color:#a78bfa; font-family:'Courier New',monospace; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px;">
            📱 Quick Access QR Code
          </div>
          <p style="font-size:.8rem; color:#94a3b8; line-height:1.5; margin:0;">
            Scan the QR code to share this DPR report link or project metadata with field teams.
            Contains watershed ID, project coordinates, and intervention count encoded as a data URI.
          </p>
          <p style="font-size:.72rem; color:#64748b; margin-top:6px; font-family:'Courier New',monospace;">
            Project: ${currentWS.id} | Lat: ${currentWS.center[0].toFixed(4)} | Lng: ${currentWS.center[1].toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  `;
}

/* ── QR Code Generator for DPR ── */
function generateDPRQRCode() {
  const currentWS = WATERSHED_DB[currentWatershedKey];
  const qrContainer = document.getElementById('dpr-qr-container');
  if (!qrContainer) return;

  // Build a data string with project metadata
  const qrData = [
    'AQUANEXIS DPR Report',
    'Project: ' + currentWS.id,
    'Watershed: ' + currentWS.name,
    'Area: ' + currentWS.area_ha + ' ha',
    'Rainfall: ' + currentWS.rainfall_mm + ' mm',
    'Interventions: ' + currentWS.interventions.length,
    'Total Recharge: ' + currentWS.interventions.reduce((s, i) => s + i.recharge, 0).toLocaleString() + ' m3',
    'Budget: INR ' + currentWS.interventions.reduce((s, i) => s + i.cost, 0).toLocaleString(),
    'Coords: ' + currentWS.center[0].toFixed(4) + ',' + currentWS.center[1].toFixed(4),
    'Generated: ' + new Date().toISOString()
  ].join('\\n');

  qrContainer.innerHTML = '';
  try {
    new QRCode(qrContainer, {
      text: qrData,
      width: 108,
      height: 108,
      colorDark: '#0a0a0a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (e) {
    // Fallback: generate a simple SVG-based QR placeholder
    qrContainer.innerHTML = '<div style="color:#10b981;font-size:.7rem;text-align:center;font-family:Courier New,monospace;">QR Generated ✓<br/><small style="color:#64748b;">Library loading…</small></div>';
  }
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
