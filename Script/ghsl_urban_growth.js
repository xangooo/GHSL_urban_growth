Map.centerObject(geometry);

// ===============================
// Load GHSL built-up dataset
// ===============================

var ghsl = imageCollection
  .filterBounds(geometry)
  .select(['built_surface']);

print('GHSL collection', ghsl);

// ===============================
// Visualization
// ===============================

Map.addLayer(
  ghsl.toBands().clip(geometry),
  {},
  'GHSL built-up',
  false
);

// ===============================
// Stack images and export GeoTIFF
// ===============================

var stack = ghsl.toBands();

Export.image.toDrive({
  image: stack.clip(geometry),
  description: 'urban_stack',
  folder: 'Urban_BuiltUp',
  region: geometry,
  scale: 100,
  maxPixels: 1e13
});

// ===============================
// Built-up area examples
// ===============================

var urban1975 = ghsl
  .filter(ee.Filter.calendarRange(1975, 1975, 'year'))
  .toBands();

var area1975 = ee.Number(
  urban1975.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 100,
    maxPixels: 1e13
  }).values().get(0)
);

print('Residential area 1975 (sq. km)', area1975.divide(1e6));

var urban2020 = ghsl
  .filter(ee.Filter.calendarRange(2020, 2020, 'year'))
  .toBands();

var area2020 = ee.Number(
  urban2020.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 100,
    maxPixels: 1e13
  }).values().get(0)
);

print('Residential area 2020 (sq. km)', area2020.divide(1e6));

// ===============================
// Time-series chart
// ===============================

var ghsl2 = ghsl.map(function (img) {
  return img
    .divide(1e6)
    .copyProperties(img, img.propertyNames());
});

print(
  ui.Chart.image.series(
    ghsl2,
    geometry,
    ee.Reducer.sum(),
    100,
    'system:time_start'
  ).setChartType('ColumnChart')
);

// ===============================
// Build area list
// ===============================

var areaList = ghsl.map(function (img) {

  var area = img.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: geometry,
    scale: 100,
    maxPixels: 1e13
  }).get('built_surface');

  return ee.Feature(null, {
    year: ee.Date(img.get('system:time_start')).get('year'),
    builtup_sqkm: ee.Number(area).divide(1e6)
  });

}).sort('year').toList(ghsl.size());

// ===============================
// Combine area + growth rate
// ===============================

var combinedTable = ee.FeatureCollection(
  ee.List.sequence(0, areaList.size().subtract(1)).map(function (i) {

    var current = ee.Feature(areaList.get(i));
    var currArea = ee.Number(current.get('builtup_sqkm'));

    var growth = ee.Algorithms.If(
      ee.Number(i).eq(0),
      null,
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

print('Final combined table', combinedTable);

// ===============================
// Export CSV
// ===============================

Export.table.toDrive({
  collection: combinedTable,
  description: 'GHSL_Builtup_Area_and_Growth',
  folder: 'Urban_BuiltUp',
  fileFormat: 'CSV'
});
