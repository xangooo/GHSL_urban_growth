# GHSL Urban Growth Analysis

This repository contains a **Google Earth Engine (GEE)** workflow for analyzing **urban built-up area expansion and growth rates** using the **GHSL Global Built-up Surface (P2023A)** dataset.

The script computes:
- Built-up area (sq. km) for each GHSL epoch
- Year-to-period growth rate (%)
- Time-series visualization
- GeoTIFF and CSV exports for further analysis

---

## 📌 Dataset

**GHSL: Global Built-up Surface**  
- Product: `JRC/GHSL/P2023A/GHS_BUILT_S`
- Temporal coverage: **1975–2030**
- Spatial resolution: **100 m**
- Unit: **Square meters (m²)**

> Source: European Commission – Joint Research Centre (JRC)

---

## 🛠️ Features

✔ Extract built-up area for a user-defined region  
✔ Generate time-series plots of urban expansion  
✔ Calculate growth rate (%) between consecutive epochs  
✔ Export:
- Multi-band GeoTIFF (stacked years)
- Single CSV containing built-up area and growth rate  

---

## 📂 Repository Structure

GHSL_urban_growth/
│
├── gee/
│ └── ghsl_urban_growth.js # Main GEE script
│
├── data/
│ └── GHSL_Builtup_Area_and_Growth.csv
│
├── figures/
│ └── builtup_timeseries.png
│
├── README.md
└── LICENSE

yaml
Copy code

---

## 🚀 How to Run

### 1. Open Google Earth Engine Code Editor
https://code.earthengine.google.com/

### 2. Import Assets
- **Geometry**: Upload or draw your Area of Interest (AOI)
- **ImageCollection**:
    [javascript]
  var imageCollection = ee.ImageCollection('JRC/GHSL/P2023A/GHS_BUILT_S');

###3. Run the Script
Paste the code from gee/ghsl_urban_growth.js

Click Run

Start export tasks from the Tasks tab

📤 Outputs
CSV Columns
Column	Description
year	GHSL epoch year
builtup_sqkm	Total built-up area (sq. km)
growth_rate_percent	Growth rate from previous epoch (%)

GeoTIFF
Multi-band raster where each band represents a GHSL year

⚠️ Notes & Limitations
GHSL epochs are not annual (5–10 year intervals)

Growth rates represent period-to-period change, not yearly CAGR

Results depend on AOI boundary accuracy

📚 Citation
If you use this code or results in academic work, please cite:

Pesaresi, M. et al.,
GHSL: Global Human Settlement Layer,
European Commission, Joint Research Centre (JRC)

📄 License
Specify a license before public reuse.
Recommended: MIT License or Apache 2.0

🤝 Contributions
Contributions, issues, and improvements are welcome.
Feel free to fork the repository and submit a pull request.

📬 Contact
Maintained by @xangooo

For questions or collaboration, please open an issue on GitHub.
