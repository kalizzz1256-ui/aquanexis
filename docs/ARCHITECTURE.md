# AQUANEXIS Architecture

GPS / Mobile Field App
        |
        +---- Geo-tagged Camera Images
        |
        v
Data Ingestion Layer
        |
        +---- Satellite / DEM / Rainfall
        +---- Land & Soil Information
        |
        v
GIS Processing Layer
        |
        +---- Watershed boundary
        +---- Slope / drainage
        +---- water & vegetation indicators
        |
        v
Prediction / Priority Engine
        |
        +---- suitability score
        +---- priority zones
        |
        v
Energy Estimation
        |
        v
Dashboard + Reports + Outcome Monitoring
