# AQUANEXIS – GIS-Based Watershed Development Decision Support System

[![WDC-PMKSY 2.0](https://img.shields.io/badge/Standard-WDC--PMKSY%202.0-10b981.svg)](https://pmksy.gov.in/)
[![OGC Compliant](https://img.shields.io/badge/Geospatial-OGC%20%2F%20GeoJSON-06b6d4.svg)](https://www.ogc.org/)
[![SDG 6](https://img.shields.io/badge/UN%20SDG-6%20Clean%20Water-38bdf8.svg)](https://sdgs.un.org/goals/goal6)

> **SIH Concept (SIH26015):** "Geospatial Techniques for Watershed Development Outcomes"  
> An integrated, future-proof, GIS-enabled decision support platform combining high-resolution satellite remote sensing, hydrological runoff modeling, Ridge-to-Valley structural siting, solar pumping feasibility, and tamper-proof field photo auditing.

---

## 🌟 Key Highlights & Features

1. **Interactive GIS Spatial Studio (`web/`)**:
   - Multi-layer interactive Leaflet GIS map with toggleable Satellite (Esri), Dark Matter, and OpenStreetMap basemaps.
   - Delineated micro-watershed boundaries and D8 flow-routed stream networks color-coded by **Strahler Stream Order (1 to 3)**.
   - Interactive structural intervention markers with quick-filtering across **Ridge, Mid-Slope, and Valley Floor** zones.

2. **Hydrological Runoff & Harvesting Simulator (SCS-CN)**:
   - Empirical USDA Soil Conservation Service Curve Number modeling.
   - Dynamic real-time calculation of potential retention ($S$), initial abstraction ($I_a$), direct runoff depth ($Q$), and harvestable rainwater yield.
   - Interactive water balance breakdown (Runoff vs Infiltration vs Harvestable Potential).

3. **Scientific Ridge-to-Valley Interventions Engine**:
   - **Ridge Treatment:** Continuous Contour Trenches (CCT) & Staggered Contour Trenches.
   - **Drainage Line Treatment:** Loose Boulder Gully Plugs & Wire-mesh Gabion dams.
   - **Valley Floor Harvesting:** Masonry Check Dams, Percolation Tanks, and Farm Ponds.
   - Automatic bill of quantities, storage capacities, aquifer recharge metrics, and budget estimation.

4. **Clean Energy & Solar Micro-Irrigation Sizing**:
   - Total dynamic head loss computation and wire-to-water hydraulic power calculation.
   - Solar PV array kWp sizing compliant with MNRE PM-KUSUM guidelines.
   - Carbon abatement analytics: lifetime diesel fuel saved and greenhouse gas CO₂ avoided.

5. **Field Geo-Camera & Verification Portal**:
   - EXIF GPS metadata verification (Latitude, Longitude, Altitude, Compass Azimuth, Timestamp).
   - Automated Geofence distance validation ($\le 50\text{m}$).
   - **Interactive Split-Screen Before vs After Audit Slider** demonstrating gully restoration and masonry check dam construction.

6. **Comprehensive System Requirements Specification (SRS)**:
   - Complete technical specifications in `docs/SYSTEM_REQUIREMENTS_SPECIFICATION.md` detailing functional, non-functional, data APIs, and a 4-phase future roadmap (Edge AI, UNet automated siting, IoT piezometers, Basin Digital Twins).

---

## 📁 Repository Structure

```
AQUANEXIS_Proposed_Solution/
├── app.py                     # Streamlit application dashboard with web launcher
├── requirements.txt           # Python dependencies
├── README.md                  # Project overview & documentation
├── web/                       # Modern Interactive GIS Web Platform
│   ├── index.html             # Single-page web application
│   ├── styles.css             # Emerald/Slate environmental design system
│   ├── app.js                 # GIS Leaflet logic, SCS-CN engine & solar sizing
│   └── assets/                # Pre & Post intervention field demonstration media
│       ├── pre_work.jpg       # Dry eroded gully baseline
│       └── post_work.jpg      # Check dam & lush green recovery
├── docs/                      # Architectural & Requirements Documentation
│   ├── SYSTEM_REQUIREMENTS_SPECIFICATION.md # Full SRS, formulas & roadmap
│   ├── ARCHITECTURE.md        # System architecture diagram
│   ├── MODULES.md             # Module specifications
│   └── DEMO_FLOW.md           # Step-by-step judge/user demonstration flow
└── data/                      # Sample datasets
    ├── sample_gps.csv         # Field GPS coordinate records
    ├── sample_land_information.csv # Soil and terrain parameters
    ├── satellite_input_template.csv # Multispectral band indicators
    └── energy_intervention_template.csv # Pumping power and hours
```

---

## 🚀 Getting Started

### Option 1: Launch the Interactive Web GIS Platform (Recommended)
Open `web/index.html` directly in any modern browser, or serve it locally:

```bash
# Using Python's built-in HTTP server
python3 -m http.server 8080 --directory web
```
Then visit `http://localhost:8080` in your web browser.

### Option 2: Run the Streamlit Dashboard
```bash
pip install -r requirements.txt
streamlit run app.py
```

---

## 📊 Scientific Equations & Reference Standards

- **SCS-CN Runoff Equation:**
  $$S = \frac{25400}{CN} - 254 \quad (\text{mm}), \quad I_a = 0.2 \cdot S$$
  $$Q = \frac{(P - I_a)^2}{P - I_a + S} \quad (\text{for } P > I_a)$$
  $$\text{Harvestable Yield} = Q \times A \times 10 \times 0.70 \quad (\text{m}^3)$$

- **Solar Hydraulic Power:**
  $$P_h = \frac{\rho \cdot g \cdot Q_d \cdot H}{3.6 \times 10^6} \quad (\text{kW}), \quad P_{pv} = \frac{P_h}{\eta_{\text{sys}}} \times 1.25 \quad (\text{kWp})$$

---

## 📜 License & Compliance
Complies with Open Geospatial Consortium (OGC) specifications and Ministry of Jal Shakti guidelines for watershed development.
# AQUA-NEXIS
