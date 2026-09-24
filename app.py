import streamlit as st
import pandas as pd
import numpy as np
import os
import webbrowser

st.set_page_config(
    page_title="AQUANEXIS - Watershed Decision Support System",
    page_icon="💧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for polished interface
st.markdown("""
<style>
    .main-header {
        font-family: 'Outfit', sans-serif;
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(90deg, #10b981, #06b6d4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
    }
    .sub-header {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-top: 0px;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: rgba(18, 30, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        border-left: 4px solid #10b981;
    }
    .highlight-badge {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        padding: 4px 10px;
        border-radius: 15px;
        font-weight: 600;
        font-size: 0.85rem;
    }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">AQUANEXIS</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">GIS-Based Watershed Development Decision Support System • WDC-PMKSY 2.0</div>', unsafe_allow_html=True)

# Top Banner for Full Modern Web GIS Studio
web_index_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "web", "index.html"))
col_b1, col_b2 = st.columns([3, 1])
with col_b1:
    st.success("✨ **Interactive Web GIS Platform Available**: Features multi-spectral satellite layers, Strahler stream order drainage networks, real-time SCS-CN runoff sliders, solar pumping calculator, and interactive split-screen before/after field photo auditing.")
with col_b2:
    if st.button("🌐 Launch Web GIS Platform", type="primary", use_container_width=True):
        webbrowser.open_new_tab(f"file://{web_index_path}")
        st.toast("Opening Web GIS Platform in your default browser!")

st.divider()

# Sidebar Setup
st.sidebar.title("💧 AQUANEXIS Controls")
watershed_selection = st.sidebar.selectbox(
    "Select Active Watershed",
    ["Kalleshwara Micro-Watershed (KA-0104)", "Wardha River Catchment Sub-4 (MH-0042)"]
)

st.sidebar.markdown("### System Modules")
st.sidebar.info("""
- **FR-1:** GIS Delineation & Topography
- **FR-2:** Earth Observation Indices (NDVI/NDWI)
- **FR-3:** Hydrological Runoff (SCS-CN)
- **FR-4:** Ridge-to-Valley Interventions
- **FR-5:** Clean Energy & Solar Pump
- **FR-6:** Field Geo-Camera Auditing
""")

st.sidebar.caption("System compliant with Bhuvan-ISRO and WDC-PMKSY 2.0 guidelines.")

# Main Tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📍 GPS / Field Data", 
    "🛰️ Satellite & DEM Indices", 
    "🌧️ Hydrology (SCS-CN)", 
    "🧱 Ridge-to-Valley Siting",
    "☀️ Clean Energy & Solar Pump",
    "📋 Requirements & Future Specs"
])

# -------------------------------------------------------------
# TAB 1: GPS / FIELD DATA
# -------------------------------------------------------------
with tab1:
    st.header("GPS & Field Observation Telemetry")
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Manual Coordinate Ingestion")
        site_id = st.text_input("Site Identifier", value="INT-CD-042")
        lat = st.number_input("Latitude (°N)", value=11.034512, format="%.6f")
        lon = st.number_input("Longitude (°E)", value=76.041219, format="%.6f")
        elevation = st.number_input("Elevation (m MSL)", value=418.4)
        structure = st.selectbox("Proposed Structure Type", [
            "Masonry Check Dam", 
            "Continuous Contour Trench (CCT)", 
            "Loose Boulder Gully Plug", 
            "Gabion Dam", 
            "Percolation Tank", 
            "Farm Pond"
        ])
        if st.button("Log Field Site Coordinates"):
            st.success(f"Site {site_id} successfully registered at ({lat:.6f}, {lon:.6f}) with elevation {elevation}m.")

    with col2:
        st.subheader("Batch GPS / Waypoints CSV Upload")
        uploaded_gps = st.file_uploader("Upload GPS Waypoints (.csv)", type=["csv"], key="gps_uploader")
        if uploaded_gps is not None:
            df_gps = pd.read_csv(uploaded_gps)
            st.dataframe(df_gps, use_container_width=True)
        else:
            sample_gps_path = os.path.join(os.path.dirname(__file__), "data", "sample_gps.csv")
            if os.path.exists(sample_gps_path):
                st.caption("Displaying default sample waypoint records (`data/sample_gps.csv`):")
                df_sample = pd.read_csv(sample_gps_path)
                st.dataframe(df_sample, use_container_width=True)

# -------------------------------------------------------------
# TAB 2: SATELLITE & DEM INDICES
# -------------------------------------------------------------
with tab2:
    st.header("Satellite Earth Observation & Remote Sensing Layers")
    st.write("Ingestion and monitoring of Sentinel-2 MSI and Copernicus 30m Digital Elevation Model rasters.")
    
    col_sat1, col_sat2, col_sat3 = st.columns(3)
    with col_sat1:
        ndvi_val = st.slider("Mean Watershed NDVI (Vegetation Index)", min_value=-0.2, max_value=1.0, value=0.64, step=0.01)
        if ndvi_val > 0.5:
            st.markdown("🟢 **Healthy Biomass Cover**")
        elif ndvi_val > 0.2:
            st.markdown("🟡 **Moderate / Scrubland Cover**")
        else:
            st.markdown("🔴 **Barren / Severely Degraded Land**")

    with col_sat2:
        ndwi_val = st.slider("Mean NDWI (Surface Water Index)", min_value=-0.5, max_value=0.8, value=0.22, step=0.01)
        if ndwi_val > 0.1:
            st.markdown("🔵 **Active Water Storage Present**")
        else:
            st.markdown("⚪ **Dry Streambed / No Surface Water**")

    with col_sat3:
        bsi_val = st.slider("Bare Soil Index (BSI)", min_value=-0.5, max_value=0.8, value=-0.19, step=0.01)
        if bsi_val > 0.1:
            st.markdown("⚠️ **High Erosion Susceptibility**")
        else:
            st.markdown("🛡️ **Protected by Vegetation / Bunding**")

    st.subheader("Satellite Band Ingestion Template")
    sample_sat_path = os.path.join(os.path.dirname(__file__), "data", "satellite_input_template.csv")
    if os.path.exists(sample_sat_path):
        st.dataframe(pd.read_csv(sample_sat_path), use_container_width=True)

# -------------------------------------------------------------
# TAB 3: HYDROLOGY & RUNOFF SIMULATOR (SCS-CN)
# -------------------------------------------------------------
with tab3:
    st.header("Hydrological Runoff & Harvesting Potential (SCS-CN)")
    col_h1, col_h2 = st.columns([1, 1])

    with col_h1:
        st.subheader("Simulation Parameters")
        area_ha = st.number_input("Watershed Area (Hectares)", min_value=1.0, value=482.5, step=10.0)
        rainfall_mm = st.number_input("Design Rainfall Event (mm)", min_value=10.0, value=845.0, step=25.0)
        soil_group = st.selectbox("Hydrologic Soil Group", ["A (High infiltration)", "B (Moderate)", "C (Slow)", "D (Very slow)"], index=1)
        lulc = st.selectbox("Land Use / Land Cover", ["Agriculture (Contour tilled)", "Scrubland", "Afforestation", "Wasteland"], index=0)

        # Compute Curve Number
        cn_matrix = {
            "Agriculture (Contour tilled)": [64, 75, 83, 87],
            "Scrubland": [48, 67, 77, 83],
            "Afforestation": [36, 60, 70, 77],
            "Wasteland": [71, 80, 87, 90]
        }
        soil_idx = 0 if "A" in soil_group else (1 if "B" in soil_group else (2 if "C" in soil_group else 3))
        cn = cn_matrix[lulc][soil_idx]
        st.metric("Derived Composite Curve Number (CN)", cn)

    with col_h2:
        st.subheader("Hydrological Yield Metrics")
        S = (25400.0 / cn) - 254.0
        Ia = 0.2 * S
        if rainfall_mm > Ia:
            Q = ((rainfall_mm - Ia) ** 2) / (rainfall_mm - Ia + S)
        else:
            Q = 0.0

        runoff_vol_cum = Q * area_ha * 10.0
        infiltration_vol_cum = max(0.0, (rainfall_mm - Q) * area_ha * 10.0)
        harvestable_target_cum = runoff_vol_cum * 0.70

        m1, m2 = st.columns(2)
        m1.metric("Direct Runoff Depth (Q)", f"{Q:.1f} mm")
        m2.metric("Runoff Coefficient", f"{(Q/rainfall_mm)*100:.1f}%")

        m3, m4 = st.columns(2)
        m3.metric("Total Runoff Yield", f"{runoff_vol_cum/1000:.1f}k m³")
        m4.metric("Harvestable Potential (70%)", f"{harvestable_target_cum/1000:.1f}k m³")

        st.info(f"💡 **Aquifer Infiltration**: Estimated {infiltration_vol_cum/1000:.1f}k m³ naturally absorbed into subsurface layers.")

# -------------------------------------------------------------
# TAB 4: RIDGE-TO-VALLEY INTERVENTIONS
# -------------------------------------------------------------
with tab4:
    st.header("Ridge-to-Valley Interventions Schedule")
    st.markdown("Interventions strictly sequence from upper ridge lines down to valley floor to arrest runoff kinetic energy.")

    interventions_data = [
        {"ID": "INT-01", "Structure": "Continuous Contour Trench (CCT)", "Zone": "Ridge", "Stream Order": 1, "Capacity (m³)": 2400, "Recharge (m³)": 7200, "Cost (INR)": 120000, "Status": "Proposed"},
        {"ID": "INT-02", "Structure": "Loose Boulder Gully Plug", "Zone": "Mid-Slope", "Stream Order": 1, "Capacity (m³)": 650, "Recharge (m³)": 1950, "Cost (INR)": 45000, "Status": "Proposed"},
        {"ID": "INT-03", "Structure": "Gabion Check Dam", "Zone": "Mid-Slope", "Stream Order": 2, "Capacity (m³)": 1600, "Recharge (m³)": 4800, "Cost (INR)": 165000, "Status": "Ongoing"},
        {"ID": "INT-04", "Structure": "Masonry Check Dam", "Zone": "Valley Floor", "Stream Order": 3, "Capacity (m³)": 5200, "Recharge (m³)": 15600, "Cost (INR)": 420000, "Status": "Completed"},
        {"ID": "INT-05", "Structure": "Earthen Percolation Tank", "Zone": "Valley Floor", "Stream Order": 3, "Capacity (m³)": 9800, "Recharge (m³)": 29400, "Cost (INR)": 680000, "Status": "Proposed"},
        {"ID": "INT-06", "Structure": "Community Farm Pond", "Zone": "Mid-Slope", "Stream Order": 2, "Capacity (m³)": 3500, "Recharge (m³)": 10500, "Cost (INR)": 210000, "Status": "Proposed"}
    ]

    df_int = pd.DataFrame(interventions_data)
    st.dataframe(df_int, use_container_width=True)

    col_tot1, col_tot2, col_tot3 = st.columns(3)
    col_tot1.metric("Total Water Storage Capacity", f"{df_int['Capacity (m³)'].sum():,} m³")
    col_tot2.metric("Annual Aquifer Recharge Potential", f"{df_int['Recharge (m³)'].sum():,} m³")
    col_tot3.metric("Total Project Cost", f"₹{df_int['Cost (INR)'].sum():,}")

# -------------------------------------------------------------
# TAB 5: CLEAN ENERGY & SOLAR PUMPING
# -------------------------------------------------------------
with tab5:
    st.header("Clean Energy & Solar Agricultural Pumping")
    st.write("Sizing solar PV arrays for zero-emission community water lifting and micro-irrigation under PM-KUSUM.")

    col_e1, col_e2 = st.columns(2)
    with col_e1:
        head_m = st.number_input("Total Dynamic Head (H in meters)", min_value=5.0, max_value=120.0, value=25.0)
        daily_vol = st.number_input("Daily Water Discharge Target (m³/day)", min_value=10.0, max_value=500.0, value=80.0)
        psh = st.slider("Peak Sun Hours (PSH)", min_value=3.5, max_value=7.0, value=5.5)

    with col_e2:
        flow_rate_sec = daily_vol / (psh * 3600)
        hydraulic_power_kw = (1000 * 9.81 * flow_rate_sec * head_m) / 1000
        pump_efficiency = 0.65
        elec_power_kw = hydraulic_power_kw / pump_efficiency
        pump_hp = elec_power_kw * 1.341
        solar_array_kwp = elec_power_kw * 1.25

        annual_kwh = elec_power_kw * psh * 300
        diesel_saved_liters = annual_kwh * 0.32
        co2_offset_tonnes = (diesel_saved_liters * 2.68) / 1000

        st.metric("Recommended Pump Motor Power", f"{pump_hp:.1f} HP ({elec_power_kw:.2f} kW)")
        st.metric("Solar PV Array Sizing", f"{solar_array_kwp:.2f} kWp")
        st.metric("Annual Diesel Saved", f"{diesel_saved_liters:,.0f} Liters")
        st.metric("Annual CO₂ Emissions Avoided", f"{co2_offset_tonnes:.2f} Tonnes CO₂e")

# -------------------------------------------------------------
# TAB 6: REQUIREMENTS & FUTURE SPECS
# -------------------------------------------------------------
with tab6:
    st.header("System Requirements Specification (SRS) & Future Roadmap")
    srs_path = os.path.join(os.path.dirname(__file__), "docs", "SYSTEM_REQUIREMENTS_SPECIFICATION.md")
    if os.path.exists(srs_path):
        with open(srs_path, "r") as f:
            st.markdown(f.read())
    else:
        st.warning("SRS document not found at docs/SYSTEM_REQUIREMENTS_SPECIFICATION.md")

st.divider()
st.caption("AQUANEXIS Decision Support System • Powered by Geospatial Remote Sensing & Hydrological Science")
