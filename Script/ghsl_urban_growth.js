/************************************************************
 * GHSL Urban Built-up Growth Analysis
 * Dataset: GHSL P2023A – Built-up Surface
 * Outputs:
 *  - Built-up area (sq. km) time series
 *  - Growth rate (%) time series
 *  - CSV export (area + growth)
 *  - AOI export
 *  - Built-up maps and figures for GitHub
 ************************************************************/


// ==========================================================
// 1. EXPORT AOI (for GitHub: data/aoi.geojson)
// ==========================================================

// Convert drawn geometry into a FeatureCollection
var aoi = ee.FeatureCollection([
  ee.Feature(geometry)
]);

// Export AOI as GeoJSON
Export.table.toDrive({
  collection: aoi,
  description: 'AOI_GeoJSON',
  folder: 'data',
  fileFormat: 'GeoJSON'
});


// ==========================================================
// 2. MAP SETUP
// ==========================================================

Map.centerObject(geometry, 9);


// ==========================================================
// 3. LOAD GHSL BUILT-UP DATA
// ==========================================================

// imageCollection is assumed to be:
// ee.ImageCollection("JRC/GHSL/P2023A/GHS_BUILT_S")

var ghsl = imageCollection
  .filterBounds(geometry)
  .select(['built_surface']);

print('GHSL ImageCollection', ghsl);


// ==========================================================
// 4. VISUALIZE BUILT-UP STACK (ALL YEARS)
// ==========================================================

var builtupStack = ghsl.toBands().clip(geometry);

Map.addLayer(
  builtupStack,
  {},
  'Built-up stack (all years)',
  false
);


// ==========================================================
// 5. EXPORT BUILT-UP STACK AS GEOTIFF
// ==========================================================

Export.image.toDrive({
  image: builtupStack,
  description: 'urban_stack',
  folder: 'data',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});


// ==========================================================
// 6. BUILT-UP AREA CALCULATION (ALL YEARS)
// ==========================================================

// Convert each image to built-up area (sq. km)
var areaList = ghsl.map(function (img) {

  var areaSqM = img.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 100,
    maxPixels: 1e13
  }).get('built_surface');

  return ee.Feature(null, {
    year: ee.Number(ee.Date(img.get('system:time_start')).get('year')),
    builtup_sqkm: ee.Number(areaSqM).divide(1e6)
  });

}).sort('year').toList(ghsl.size());


// ==========================================================
// 7. COMBINE BUILT-UP AREA + GROWTH RATE (%)
// ==========================================================

var combinedTable = ee.FeatureCollection(
  ee.List.sequence(0, areaList.size().subtract(1)).map(function (i) {

    var current = ee.Feature(areaList.get(i));
    var currArea = ee.Number(current.get('builtup_sqkm'));

    // Growth rate calculation
    var growth = ee.Algorithms.If(
      ee.Number(i).eq(0),
      null, // First year has no growth rate
      currArea
        .subtract(
          ee.Number(
            ee.Feature(areaList.get(ee.Number(i).subtract(1)))
              .get('builtup_sqkm')
          )
        )
        .divide(
          ee.Number(
            ee.Feature(areaList.get(ee.Number(i).subtract(1)))
              .get('builtup_sqkm')
          )
        )
        .multiply(100)
    );

    return ee.Feature(null, {
      year: current.get('year'),
      builtup_sqkm: currArea,
      growth_rate_percent: growth
    });
  })
);

print('Built-up area + growth table', combinedTable);


// ==========================================================
// 8. EXPORT CSV (FOR GITHUB: data/)
// ==========================================================

Export.table.toDrive({
  collection: combinedTable,
  description: 'GHSL_Builtup_Area_and_Growth',
  folder: 'data',
  fileFormat: 'CSV'
});


// ==========================================================
// 9. PLOT TIME-SERIES GRAPHS
// ==========================================================

// Built-up area chart
print(
  ui.Chart.feature.byFeature(
    combinedTable,
    'year',
    'builtup_sqkm'
  )
  .setChartType('ColumnChart')
  .setOptions({
    title: 'Built-up Area (sq. km)',
    hAxis: { title: 'Year', format: '####' },
    vAxis: { title: 'Built-up Area (sq. km)' },
    legend: { position: 'none' }
  })
);

// Growth rate chart
print(
  ui.Chart.feature.byFeature(
    combinedTable,
    'year',
    'growth_rate_percent'
  )
  .setChartType('ColumnChart')
  .setOptions({
    title: 'Built-up Area Growth Rate (%)',
    hAxis: { title: 'Year', format: '####' },
    vAxis: { title: 'Growth Rate (%)' },
    legend: { position: 'none' }
  })
);


// ==========================================================
// 10. BUILT-UP MAPS FOR FIGURES FOLDER
// ==========================================================

// Visualization parameters
var visBuilt = {
  min: 0,
  max: 1,
  palette: ['ffffff', 'ff0000']
};

// Built-up 1975
var builtup1975 = ghsl
  .filter(ee.Filter.calendarRange(1975, 1975, 'year'))
  .first()
  .clip(geometry);

Map.addLayer(builtup1975, visBuilt, 'Built-up 1975');

Export.image.toDrive({
  image: builtup1975.visualize(visBuilt),
  description: 'builtup_1975',
  folder: 'figures',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});

// Built-up 2020
var builtup2020 = ghsl
  .filter(ee.Filter.calendarRange(2020, 2020, 'year'))
  .first()
  .clip(geometry);

Map.addLayer(builtup2020, visBuilt, 'Built-up 2020');

Export.image.toDrive({
  image: builtup2020.visualize(visBuilt),
  description: 'builtup_2020',
  folder: 'figures',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});


// ==========================================================
// 11. AOI BOUNDARY FIGURE
// ==========================================================

Map.addLayer(geometry, { color: 'blue' }, 'AOI boundary');

Export.image.toDrive({
  image: ee.Image().paint(geometry, 1, 3),
  description: 'aoi_boundary',
  folder: 'figures',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});


// ==========================================================
// 12. BUILT-UP CHANGE MAP (2020 – 1975)
// ==========================================================

var builtupChange = builtup2020.subtract(builtup1975);

var visChange = {
  min: -1,
  max: 1,
  palette: ['blue', 'white', 'red'] // loss → no change → gain
};

Map.addLayer(builtupChange, visChange, 'Built-up change 1975–2020');

Export.image.toDrive({
  image: builtupChange.visualize(visChange),
  description: 'builtup_change_1975_2020',
  folder: 'figures',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});
