# CPC analytics map sources

- Global country geometry: Natural Earth, `ne_110m_admin_0_countries.geojson`, public domain.
- China geometry: Alibaba Cloud DataV GeoAtlas `areas_v3/bound/100000_full.json`.
  DataV states that its administrative-boundary data is sourced from AMap.

`world-cpc.json` removes the Natural Earth China and Taiwan features and replaces them with
the complete provincial-level geometry from the domestic DataV source, including Taiwan,
Hong Kong, Macao, and the South China Sea island geometry supplied by that dataset.

The generated file is bundled locally. The production dashboard does not request map tiles or
boundary data from a third party at runtime.
