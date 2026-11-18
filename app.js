(function () {
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* yoksay */ } },
  };

  let theme = store.get('rdr-theme') === 'night' ? 'night' : 'day';
  const applyThemeClass = () => document.body.classList.toggle('night', theme === 'night');
  applyThemeClass();

  // son görünüm (yoksa İstanbul)
  let start = { center: [28.98, 41.01], zoom: 11.2 };
  try { const v = JSON.parse(store.get('rdr-view')); if (v && v.center) start = v; } catch (e) { /* yoksay */ }

  const map = new maplibregl.Map({
    container: 'map',
    style: RDRStyle.buildStyle(theme),
    center: start.center, zoom: start.zoom, bearing: start.bearing || 0,
    maxZoom: 19.5, minZoom: 1.5,
    attributionControl: false,
    dragRotate: true, pitchWithRotate: false, maxPitch: 0,
    fadeDuration: 150,
  });
  window.map = map;

  map.on('style.load', () => RDRIcons.addTo(map, theme));
  map.on('moveend', () => {
    const c = map.getCenter();
    store.set('rdr-view', JSON.stringify({ center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing() }));
  });
  map.on('error', (e) => { if (e && e.error && /Failed to fetch|NetworkError/i.test(e.error.message || '')) $('#offline').hidden = false; });
  map.on('data', () => { $('#offline').hidden = true; });

  // ---- tema ----
  $('#btn-theme').addEventListener('click', () => {
    theme = theme === 'day' ? 'night' : 'day';
    store.set('rdr-theme', theme);
    applyThemeClass();
    map.setStyle(RDRStyle.buildStyle(theme), { diff: false });
    buildLegend();
  });

  // ---- yakınlaştırma / pusula ----
  $('#btn-in').addEventListener('click', () => map.zoomIn({ duration: 250 }));
  $('#btn-out').addEventListener('click', () => map.zoomOut({ duration: 250 }));
  const needle = $('#compass-needle');
  const updNeedle = () => { needle.style.transform = 'rotate(' + (-map.getBearing()) + 'deg)'; };
  map.on('rotate', updNeedle); updNeedle();
  $('#btn-compass').addEventListener('click', () => map.easeTo({ bearing: 0, duration: 400 }));

  // ---- konum ----
  const meEl = document.createElement('div');
  meEl.className = 'me';
  meEl.innerHTML = '<div class="me-pulse"></div><svg viewBox="-12 -14 24 28" width="26" height="30"><path d="M0 -12 L8 10 L0 5 L-8 10 Z" /></svg>';
  let meMarker = null, watchId = null, follow = false, lastFix = null;

  function setFollow(on) {
    follow = on;
    $('#btn-locate').classList.toggle('active', on);
  }
  function onFix(pos) {
    const { latitude, longitude, heading } = pos.coords;
    lastFix = [longitude, latitude];
    if (!meMarker) meMarker = new maplibregl.Marker({ element: meEl, rotationAlignment: 'map' }).setLngLat(lastFix).addTo(map);
    meMarker.setLngLat(lastFix);
    if (typeof heading === 'number' && !isNaN(heading)) meMarker.setRotation(heading);
    if (follow) map.easeTo({ center: lastFix, duration: 600 });
  }
  function startGeo(centerNow) {
    if (!('geolocation' in navigator)) { toast('Bu cihaz konum desteklemiyor.'); return; }
    if (watchId === null) {
      watchId = navigator.geolocation.watchPosition(onFix, (err) => {
        toast(err.code === 1 ? 'Konum izni verilmedi.' : 'Konum alınamadı.');
        navigator.geolocation.clearWatch(watchId); watchId = null; setFollow(false);
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
      store.set('rdr-geo', '1');
    }
    if (centerNow) {
      setFollow(true);
      if (lastFix) map.easeTo({ center: lastFix, zoom: Math.max(map.getZoom(), 15), duration: 700 });
      else navigator.geolocation.getCurrentPosition((p) => {
        onFix(p); map.easeTo({ center: lastFix, zoom: Math.max(map.getZoom(), 15), duration: 700 });
      }, () => {}, { enableHighAccuracy: true, timeout: 15000 });
    }
  }
  $('#btn-locate').addEventListener('click', () => {
    if (follow) { setFollow(false); return; }
    startGeo(true);
  });
  // kullanıcı haritayı elle kaydırırsa takibi bırak
  map.on('dragstart', () => setFollow(false));
  if (store.get('rdr-geo') === '1') startGeo(false);

  // ---- arama (Nominatim) ----
  const q = $('#q'), list = $('#results');
  let timer = null, seq = 0;
  async function search(text) {
    const my = ++seq;
    try {
      const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=tr&q=' + encodeURIComponent(text);
      const r = await fetch(u);
      const rows = await r.json();
      if (my !== seq) return;
      list.innerHTML = '';
      if (!rows.length) { list.innerHTML = '<li class="none">Bulunamadı</li>'; list.hidden = false; return; }
      rows.forEach((row) => {
        const li = document.createElement('li');
        li.textContent = row.display_name;
        li.addEventListener('click', () => {
          list.hidden = true; q.blur();
          if (row.boundingbox) {
            const b = row.boundingbox.map(Number); // [s, n, w, e]
            map.fitBounds([[b[2], b[0]], [b[3], b[1]]], { padding: 60, maxZoom: 17, duration: 900 });
          } else map.flyTo({ center: [+row.lon, +row.lat], zoom: 15 });
        });
        list.appendChild(li);
      });
      list.hidden = false;
    } catch (e) { list.innerHTML = '<li class="none">Arama şu an çalışmıyor</li>'; list.hidden = false; }
  }
  q.addEventListener('input', () => {
    clearTimeout(timer);
    const v = q.value.trim();
    if (v.length < 3) { list.hidden = true; return; }
    timer = setTimeout(() => search(v), 650);
  });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(timer); const v = q.value.trim(); if (v) search(v); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('#search')) list.hidden = true; });

  // ---- simge rehberi ----
  const LABELS = {
    hospital: 'Hastane / klinik', pharmacy: 'Eczane', police: 'Karakol', clothes: 'Giyim dükkânı', barber: 'Berber / kuaför',
    bank: 'Banka', coin: 'ATM', restaurant: 'Lokanta', cafe: 'Kafe / fırın', bar: 'Bar / meyhane', shop: 'Dükkân / market',
    post: 'Postane', fuel: 'Akaryakıt', lodging: 'Otel', book: 'Okul / kütüphane', church: 'Kilise', mosque: 'Cami',
    fire: 'İtfaiye', train: 'Tren / metro durağı', bus: 'Otobüs durağı', tree: 'Park / kamp', landmark: 'Görülecek yer', grave: 'Mezarlık',
  };
  function buildLegend() {
    const ul = $('#legend-list');
    ul.innerHTML = '';
    RDRIcons.names.forEach((n) => {
      const li = document.createElement('li');
      const img = new Image(26, 26); img.src = RDRIcons.dataURL(n, theme); img.alt = '';
      const sp = document.createElement('span'); sp.textContent = LABELS[n] || n;
      li.append(img, sp); ul.appendChild(li);
    });
  }
  buildLegend();
  $('#btn-legend').addEventListener('click', () => { const l = $('#legend'); l.hidden = !l.hidden; });
  $('#legend-close').addEventListener('click', () => { $('#legend').hidden = true; });

  // ---- mekân bilgi paneli (simgeye tıklayınca) ----
  const panel = $('#place');
  let placeSeq = 0;
  const KIND_TR = {
    hospital: 'Hastane', clinic: 'Klinik', doctors: 'Doktor', dentist: 'Diş hekimi', pharmacy: 'Eczane', police: 'Karakol',
    clothes: 'Giyim dükkânı', hairdresser: 'Kuaför', barber: 'Berber', bank: 'Banka', atm: 'ATM', restaurant: 'Lokanta',
    fast_food: 'Fast food', cafe: 'Kafe', bakery: 'Fırın', bar: 'Bar', pub: 'Pub', supermarket: 'Market', convenience: 'Bakkal',
    post_office: 'Postane', fuel: 'Akaryakıt', hotel: 'Otel', hostel: 'Hostel', guest_house: 'Pansiyon', school: 'Okul',
    kindergarten: 'Anaokulu', university: 'Üniversite', library: 'Kütüphane', place_of_worship: 'İbadethane', fire_station: 'İtfaiye',
    park: 'Park', museum: 'Müze', attraction: 'Görülecek yer', cemetery: 'Mezarlık', bus_stop: 'Otobüs durağı',
    bus_station: 'Otogar', railway: 'Tren / metro', station: 'İstasyon', stop: 'Durak', shop: 'Dükkân', mall: 'Alışveriş merkezi',
  };
  const hide = () => { placeSeq++; panel.hidden = true; };
  $('#place-close').addEventListener('click', hide);

  function addRow(dl, label, node) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.append(node);
    dl.append(dt, dd);
  }
  function linkNode(text, href) {
    const a = document.createElement('a'); a.textContent = text; a.href = href;
    if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function safeUrl(u) {
    if (!u) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    return /^https?:\/\//i.test(u) ? u : null;
  }
  function addressOf(a) {
    if (!a) return '';
    const line1 = [a.road || a.pedestrian || a.footway, a.house_number].filter(Boolean).join(' ');
    const line2 = [a.quarter || a.suburb || a.neighbourhood, a.town || a.city_district || a.city].filter(Boolean).join(', ');
    return [line1, line2].filter(Boolean).join(', ');
  }
  function fillDetails(row) {
    const t = row.extratags || {};
    const dl = $('#place-info');
    const addr = addressOf(row.address);
    if (addr) addRow(dl, 'Adres', document.createTextNode(addr));
    const phone = t.phone || t['contact:phone'];
    if (phone) addRow(dl, 'Telefon', linkNode(phone, 'tel:' + phone.split(/[;,]/)[0].replace(/[^+\d]/g, '')));
    const oh = t.opening_hours;
    if (oh) addRow(dl, 'Saatler', document.createTextNode(oh === '24/7' ? '7/24 açık' : oh));
    const web = safeUrl(t.website || t['contact:website']);
    if (web) addRow(dl, 'Web', linkNode(web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), web));
    if (!dl.children.length) { $('#place-loading').textContent = 'Bu yer için kayıtlı ek bilgi yok.'; $('#place-loading').hidden = false; }
  }
  async function loadDetails(name, lngLat, my) {
    const lat = lngLat.lat, lon = lngLat.lng, d = 0.0008; // ~90 m kutu
    const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&extratags=1&addressdetails=1&accept-language=tr&bounded=1'
      + '&viewbox=' + [lon - d, lat + d, lon + d, lat - d].join(',') + '&q=' + encodeURIComponent(name);
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 10000);
      const r = await fetch(u, { signal: ctl.signal }); clearTimeout(to);
      const rows = await r.json();
      if (my !== placeSeq) return;
      const dist = (x) => Math.hypot(+x.lat - lat, +x.lon - lon);
      const hit = rows.slice().sort((a, b) => dist(a) - dist(b))[0];
      $('#place-loading').hidden = true;
      if (hit) fillDetails(hit);
      else { $('#place-loading').textContent = 'Bu yer için kayıtlı ek bilgi yok.'; $('#place-loading').hidden = false; }
    } catch (e) {
      if (my !== placeSeq) return;
      $('#place-loading').textContent = 'Ayrıntılar şu an alınamadı.'; $('#place-loading').hidden = false;
    }
  }
  function showPlace(f, lngLat) {
    const p = f.properties || {};
    const name = p['name:latin'] || p.name || '';
    const kindKey = p.subclass || p.class || '';
    const my = ++placeSeq;
    $('#place-name').textContent = name || (KIND_TR[kindKey] || 'Mekân');
    $('#place-kind').textContent = name ? (KIND_TR[kindKey] || kindKey.replace(/_/g, ' ')) : '';
    $('#place-info').innerHTML = '';
    const act = $('#place-actions'); act.innerHTML = '';
    act.append(linkNode('Yol tarifi', 'https://www.google.com/maps/dir/?api=1&destination=' + lngLat.lat + ',' + lngLat.lng));
    const ld = $('#place-loading');
    ld.textContent = 'Ayrıntılar aranıyor…';
    ld.hidden = !name;
    panel.hidden = false;
    if (name) loadDetails(p.name || name, lngLat, my);
  }
  const POI_LAYERS = ['poi', 'poi-bus'];
  map.on('click', (e) => {
    const pad = 8;
    const feats = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: POI_LAYERS });
    if (!feats.length) { hide(); return; }
    const f = feats[0];
    const c = f.geometry && f.geometry.type === 'Point' ? { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] } : e.lngLat;
    showPlace(f, c);
  });
  map.on('mousemove', (e) => {
    const pad = 6;
    const over = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: POI_LAYERS }).length > 0;
    map.getCanvas().style.cursor = over ? 'pointer' : '';
  });

  // ---- küçük bildirim ----
  let tt = null;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---- PWA ----
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
