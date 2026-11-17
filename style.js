/* MapLibre stil üreticisi — OpenFreeMap (OpenMapTiles şeması) üzerine
   "eski zaman haritası" görünümü. buildStyle('day' | 'night') */
(function () {
  const PALETTES = {
    day: {
      paper: '#d9c597', water: '#a3b3a8', waterLine: '#7f9189', wood: '#c4bb88', grass: '#cfc592', farm: '#d6c595',
      sand: '#e0d0a0', rock: '#bfab80', resi: '#d1ba8b', indus: '#c6ad82', inst: '#d5bf8e', park: '#c9c08d',
      bldg: '#b89b6d', bldgLine: '#7d5f3d', roadCase: '#5e4128', roadFill: '#ead9ab', roadMinor: '#8a6b46',
      path: '#7d6244', rail: '#33231a', bound: '#7b3a28', text: '#3a2819', halo: '#dccb9e', textWater: '#4d625f',
      textMinor: '#5a4429', peak: '#6e5236',
    },
    night: {
      paper: '#1d1915', water: '#2a3335', waterLine: '#3c4a4c', wood: '#252519', grass: '#27261b', farm: '#2a271c',
      sand: '#34301f', rock: '#2d2820', resi: '#231f19', indus: '#2a2520', inst: '#27231c', park: '#25261b',
      bldg: '#3a3125', bldgLine: '#5b4a37', roadCase: '#0d0b09', roadFill: '#7a6a4e', roadMinor: '#5d5039',
      path: '#6a5a42', rail: '#a8977a', bound: '#935444', text: '#d2be93', halo: '#1d1915', textWater: '#8aa09c',
      textMinor: '#a99a78', peak: '#a99a78',
    },
  };

  const F_BOLD = ['Noto Sans Bold'];
  const F_REG = ['Noto Sans Regular'];
  const F_ITAL = ['Noto Sans Italic'];

  const zw = (base) => ['interpolate', ['exponential', 1.6], ['zoom'], 5, base * 0.12, 10, base * 0.55, 14, base * 1.5, 18, base * 6];

  function buildStyle(theme) {
    const P = PALETTES[theme];
    const SRC = 'openmaptiles';
    const poiAll = [].concat.apply([], Object.keys(RDRIcons.MAP).map((k) => RDRIcons.MAP[k]));
    const busList = ['bus', 'bus_stop', 'bus_station'];
    const poiMain = poiAll.filter((x) => busList.indexOf(x) < 0);

    // simge ifadesi: önce alt sınıf, sonra sınıf
    const iconMatch = (field) => {
      const e = ['match', ['get', field]];
      Object.keys(RDRIcons.MAP).forEach((k) => { e.push(RDRIcons.MAP[k], 'ic-' + k); });
      e.push('');
      return e;
    };
    const iconExpr = ['let', 'bySub', iconMatch('subclass'),
      ['case', ['!=', ['var', 'bySub'], ''], ['var', 'bySub'], iconMatch('class')]];
    const poiFilter = (list) => ['any', ['in', ['get', 'subclass'], ['literal', list]], ['in', ['get', 'class'], ['literal', list]]];

    const L = [];
    const add = (l) => { l.source = SRC; L.push(l); };

    L.push({ id: 'bg', type: 'background', paint: { 'background-color': P.paper } });

    add({ id: 'landcover', type: 'fill', 'source-layer': 'landcover', paint: {
      'fill-color': ['match', ['get', 'class'], 'wood', P.wood, 'grass', P.grass, 'farmland', P.farm, 'sand', P.sand, 'rock', P.rock, 'wetland', P.water, P.grass],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.55, 14, 0.8] } });

    add({ id: 'landuse', type: 'fill', 'source-layer': 'landuse', minzoom: 8, paint: {
      'fill-color': ['match', ['get', 'class'],
        ['residential', 'suburb', 'quarter', 'neighbourhood'], P.resi,
        ['industrial', 'commercial', 'retail', 'garages', 'railway'], P.indus,
        ['hospital', 'school', 'university', 'college', 'kindergarten', 'library', 'stadium'], P.inst,
        ['cemetery', 'playground', 'pitch', 'zoo', 'theme_park'], P.park, P.resi],
      'fill-opacity': 0.75 } });

    add({ id: 'park', type: 'fill', 'source-layer': 'park', paint: { 'fill-color': P.park, 'fill-opacity': 0.55 } });

    add({ id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': P.water } });
    add({ id: 'water-edge', type: 'line', 'source-layer': 'water', minzoom: 6, paint: {
      'line-color': P.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 16, 1.4], 'line-opacity': 0.8 } });
    add({ id: 'waterway', type: 'line', 'source-layer': 'waterway', minzoom: 9, paint: {
      'line-color': P.water, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 0.6, 14, 2.2, 18, 7] },
      layout: { 'line-cap': 'round' } });

    add({ id: 'building', type: 'fill', 'source-layer': 'building', minzoom: 13.5, paint: {
      'fill-color': P.bldg, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15.5, 0.9] } });
    add({ id: 'building-line', type: 'line', 'source-layer': 'building', minzoom: 15.5, paint: {
      'line-color': P.bldgLine, 'line-width': 0.7, 'line-opacity': 0.8 } });

    // ---- yollar ----
    const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'];
    const road = (id, classes, minzoom, widthBase, fill, casing) => {
      const f = ['all', ['in', ['get', 'class'], ['literal', classes]], notTunnel];
      if (casing) add({ id: id + '-case', type: 'line', 'source-layer': 'transportation', minzoom, filter: f,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': P.roadCase, 'line-width': zw(widthBase + 1.1) } });
      add({ id, type: 'line', 'source-layer': 'transportation', minzoom, filter: f,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': fill, 'line-width': zw(widthBase) } });
    };
    // sıra: küçükten büyüğe
    add({ id: 'road-path', type: 'line', 'source-layer': 'transportation', minzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]],
      layout: { 'line-cap': 'butt' },
      paint: { 'line-color': P.path, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.7, 18, 1.6], 'line-dasharray': [3, 2] } });
    road('road-service', ['service'], 14, 0.7, P.roadMinor, false);
    road('road-minor', ['minor'], 12, 1.1, P.roadMinor, false);
    road('road-secondary', ['secondary', 'tertiary'], 9, 1.5, P.roadFill, true);
    road('road-primary', ['primary'], 7, 1.9, P.roadFill, true);
    road('road-trunk', ['trunk', 'motorway'], 5, 2.3, P.roadFill, true);

    // demiryolu: ince çizgi + çapraz tırtıklar
    const railF = ['all', ['==', ['get', 'class'], 'rail'],
      ['in', ['get', 'subclass'], ['literal', ['rail', 'narrow_gauge', 'preserved', 'light_rail']]], notTunnel];
    add({ id: 'rail', type: 'line', 'source-layer': 'transportation', minzoom: 8, filter: railF,
      paint: { 'line-color': P.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 16, 1.8] } });
    add({ id: 'rail-ticks', type: 'line', 'source-layer': 'transportation', minzoom: 11, filter: railF,
      paint: { 'line-color': P.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 7], 'line-dasharray': [0.18, 1.7] } });

    // sınırlar
    add({ id: 'boundary', type: 'line', 'source-layer': 'boundary', minzoom: 2,
      filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': P.bound, 'line-dasharray': [5, 2, 1, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 10, 1.6, 16, 2.4], 'line-opacity': 0.85 } });

    // ---- etiketler ----
    const txt = (extra) => Object.assign({ 'text-font': F_REG, 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']] }, extra);
    const halo = (c, w) => ({ 'text-color': c || P.text, 'text-halo-color': P.halo, 'text-halo-width': w || 1.6, 'text-halo-blur': 0.4 });

    add({ id: 'water-label', type: 'symbol', 'source-layer': 'water_name', minzoom: 3,
      layout: txt({ 'text-font': F_ITAL, 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 12, 15], 'text-letter-spacing': 0.18, 'text-max-width': 8 }),
      paint: halo(P.textWater, 1.2) });

    add({ id: 'road-label', type: 'symbol', 'source-layer': 'transportation_name', minzoom: 13.5,
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor']]],
      layout: txt({ 'symbol-placement': 'line', 'text-font': F_ITAL, 'text-size': ['interpolate', ['linear'], ['zoom'], 13.5, 10, 18, 13],
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']], 'text-letter-spacing': 0.04, 'text-padding': 4 }),
      paint: halo(P.textMinor, 1.8) });

    add({ id: 'peak', type: 'circle', 'source-layer': 'mountain_peak', minzoom: 11,
      paint: { 'circle-radius': 2.4, 'circle-color': P.peak, 'circle-stroke-color': P.halo, 'circle-stroke-width': 1 } });
    add({ id: 'peak-label', type: 'symbol', 'source-layer': 'mountain_peak', minzoom: 11,
      layout: txt({ 'text-font': F_ITAL, 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 0.5],
        'text-field': ['concat', ['coalesce', ['get', 'name:latin'], ['get', 'name']], ['case', ['has', 'ele'], ['concat', '\n', ['to-string', ['get', 'ele']], ' m'], '']] }),
      paint: halo(P.peak, 1.4) });

    const place = (id, classes, minzoom, maxzoom, size, font, upper, spacing) => add({
      id, type: 'symbol', 'source-layer': 'place', minzoom, maxzoom,
      filter: ['in', ['get', 'class'], ['literal', classes]],
      layout: txt({ 'text-font': font, 'text-size': size, 'text-transform': upper ? 'uppercase' : 'none',
        'text-letter-spacing': spacing, 'text-max-width': 7, 'symbol-sort-key': ['coalesce', ['get', 'rank'], 99] }),
      paint: halo(P.text, 1.8) });
    place('place-country', ['country'], 1, 7, ['interpolate', ['linear'], ['zoom'], 1, 10, 6, 17], F_BOLD, true, 0.25);
    place('place-state', ['state', 'province'], 4, 9, ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 14], F_ITAL, true, 0.2);
    place('place-city', ['city'], 4, 16, ['interpolate', ['linear'], ['zoom'], 4, 11, 10, 17, 14, 22], F_BOLD, true, 0.14);
    place('place-town', ['town'], 8, 16, ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 17], F_BOLD, true, 0.1);
    place('place-village', ['village', 'hamlet'], 11, 17, ['interpolate', ['linear'], ['zoom'], 11, 10, 16, 13], F_REG, false, 0.06);
    place('place-suburb', ['suburb', 'quarter', 'neighbourhood', 'borough'], 12.5, 18, ['interpolate', ['linear'], ['zoom'], 12.5, 10, 17, 14], F_ITAL, false, 0.04);

    // ---- mekân (POI) simgeleri ----
    const poi = (id, list, minzoom, textZoom) => add({
      id, type: 'symbol', 'source-layer': 'poi', minzoom, filter: poiFilter(list),
      layout: {
        'icon-image': iconExpr, 'icon-allow-overlap': false, 'icon-padding': 3, 'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.78, 18, 1.1],
        'text-field': ['step', ['zoom'], '', textZoom, ['coalesce', ['get', 'name:latin'], ['get', 'name']]],
        'text-font': F_ITAL, 'text-size': 10.5, 'text-anchor': 'top', 'text-offset': [0, 1.15], 'text-max-width': 7, 'text-optional': true,
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 1000],
      },
      paint: halo(P.text, 1.6) });
    poi('poi', poiMain, 14.5, 16.2);
    poi('poi-bus', busList, 16.6, 17.5);

    return {
      version: 8,
      name: 'rdr2-' + theme,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: { openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
      layers: L,
    };
  }

  window.RDRStyle = { buildStyle, PALETTES };
})();
