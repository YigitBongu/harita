/* Özgün harita simgeleri — canvas ile çizilir (oyundan alınmış görsel yok).
   Her simge 24x24 birimlik bir kutuda çizilir, yuvarlak bir rozet içine yerleştirilir. */
(function () {
  const TAU = Math.PI * 2;

  // ---- Glif çizicileri: (c, ink, bg) ----
  const G = {
    hospital(c, ink) {
      c.fillStyle = ink;
      c.fillRect(10, 5, 4, 14);
      c.fillRect(5, 10, 14, 4);
    },
    pharmacy(c, ink, bg) {
      c.fillStyle = ink;
      c.fillRect(10, 4.5, 4, 2);
      c.fillRect(10.5, 6.5, 3, 3);
      c.beginPath();
      c.moveTo(8, 10); c.lineTo(16, 10); c.lineTo(16, 19); c.lineTo(8, 19); c.closePath();
      c.fill();
      c.fillStyle = bg;
      c.fillRect(11.2, 12, 1.6, 5);
      c.fillRect(9.5, 13.7, 5, 1.6);
    },
    police(c, ink) {
      c.fillStyle = ink;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 3.2 : 7.6;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        c[i ? 'lineTo' : 'moveTo'](12 + r * Math.cos(a), 12.4 + r * Math.sin(a));
      }
      c.closePath(); c.fill();
    },
    clothes(c, ink) {
      c.fillStyle = ink;
      c.beginPath();
      [[8.5,5],[11,6.2],[13,6.2],[15.5,5],[20,8.8],[17.8,11.2],[16.4,10],[16.4,19],[7.6,19],[7.6,10],[6.2,11.2],[4,8.8]]
        .forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1]));
      c.closePath(); c.fill();
    },
    barber(c, ink) {
      c.strokeStyle = ink; c.lineWidth = 1.7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(8.6, 14.6); c.lineTo(16.2, 4.8); c.moveTo(15.4, 14.6); c.lineTo(7.8, 4.8); c.stroke();
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(8, 17, 2.4, 0, TAU); c.stroke();
      c.beginPath(); c.arc(16, 17, 2.4, 0, TAU); c.stroke();
    },
    bank(c, ink) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(12, 4.5); c.lineTo(19.5, 9.5); c.lineTo(4.5, 9.5); c.closePath(); c.fill();
      c.fillRect(6.5, 11, 2.2, 6); c.fillRect(10.9, 11, 2.2, 6); c.fillRect(15.3, 11, 2.2, 6);
      c.fillRect(4.5, 18, 15, 2);
    },
    coin(c, ink, bg) {
      c.fillStyle = ink; c.beginPath(); c.arc(12, 12, 7, 0, TAU); c.fill();
      c.strokeStyle = bg; c.lineWidth = 1.2; c.beginPath(); c.arc(12, 12, 4.6, 0, TAU); c.stroke();
    },
    restaurant(c, ink) {
      c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 1.3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(6.8, 5); c.lineTo(6.8, 10); c.moveTo(9, 5); c.lineTo(9, 10); c.moveTo(11.2, 5); c.lineTo(11.2, 10); c.stroke();
      c.beginPath(); c.moveTo(6.8, 10); c.quadraticCurveTo(9, 12.5, 11.2, 10); c.stroke();
      c.fillRect(8.2, 11, 1.6, 8.5);
      c.beginPath(); c.moveTo(15, 5); c.quadraticCurveTo(18.6, 7, 16.8, 13); c.lineTo(15, 13); c.closePath(); c.fill();
      c.fillRect(15, 12.5, 1.8, 7);
    },
    cafe(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(6.5, 9); c.lineTo(15.5, 9); c.lineTo(15, 16); c.quadraticCurveTo(11, 18, 7, 16); c.closePath(); c.fill();
      c.strokeStyle = ink; c.lineWidth = 1.5;
      c.beginPath(); c.arc(16, 12, 2.4, -1.2, 1.2); c.stroke();
      c.fillRect(5, 18.2, 12, 1.5);
      c.strokeStyle = ink; c.lineWidth = 1.1; c.lineCap = 'round';
      c.beginPath(); c.moveTo(9.2, 7.2); c.quadraticCurveTo(10.2, 6, 9.2, 4.8); c.moveTo(12.4, 7.2); c.quadraticCurveTo(13.4, 6, 12.4, 4.8); c.stroke();
    },
    bar(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(6.5, 5.5); c.lineTo(17.5, 5.5); c.lineTo(15.4, 18); c.lineTo(8.6, 18); c.closePath(); c.fill();
      c.fillRect(7.6, 18.2, 8.8, 1.8);
      c.fillStyle = bg; c.fillRect(7.6, 8.6, 8.8, 1.2);
    },
    shop(c, ink, bg) {
      c.fillStyle = ink; c.fillRect(6.5, 9.5, 11, 10);
      c.strokeStyle = ink; c.lineWidth = 1.5;
      c.beginPath(); c.arc(12, 9.5, 3, Math.PI, 0); c.stroke();
      c.fillStyle = bg; c.fillRect(10.7, 12.5, 2.6, 1.2);
    },
    post(c, ink, bg) {
      c.fillStyle = ink; c.fillRect(4.8, 7, 14.4, 10.4);
      c.strokeStyle = bg; c.lineWidth = 1.2; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(5.2, 7.6); c.lineTo(12, 13.2); c.lineTo(18.8, 7.6); c.stroke();
    },
    fuel(c, ink, bg) {
      c.fillStyle = ink; c.fillRect(6.5, 5, 7.5, 14); c.fillRect(5.5, 19, 9.5, 1.6);
      c.fillStyle = bg; c.fillRect(8, 6.8, 4.5, 4);
      c.strokeStyle = ink; c.lineWidth = 1.4; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(14, 9); c.lineTo(16.8, 9); c.lineTo(16.8, 15.5); c.stroke();
    },
    lodging(c, ink) {
      c.fillStyle = ink;
      c.fillRect(4.6, 8, 1.8, 11); c.fillRect(4.6, 14, 14.8, 3);
      c.fillRect(17.6, 14, 1.8, 5); c.fillRect(7.5, 11, 4.4, 2.6);
      c.fillRect(13, 11.6, 6.4, 2);
    },
    book(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(12, 7.4); c.lineTo(4.8, 6); c.lineTo(4.8, 17); c.lineTo(12, 18.6); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(12, 7.4); c.lineTo(19.2, 6); c.lineTo(19.2, 17); c.lineTo(12, 18.6); c.closePath(); c.fill();
      c.strokeStyle = bg; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(12, 7.6); c.lineTo(12, 18.4); c.stroke();
    },
    church(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(6, 12); c.lineTo(12, 8); c.lineTo(18, 12); c.lineTo(18, 19.5); c.lineTo(6, 19.5); c.closePath(); c.fill();
      c.fillRect(11.2, 3.2, 1.6, 5.6); c.fillRect(9.8, 4.8, 4.4, 1.5);
      c.fillStyle = bg; c.fillRect(10.8, 14.5, 2.4, 5);
    },
    mosque(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.arc(11, 12.4, 5, Math.PI, 0); c.lineTo(16, 19.5); c.lineTo(6, 19.5); c.closePath(); c.fill();
      c.fillRect(10.4, 5.6, 1.2, 2);
      c.fillRect(17.4, 6.5, 1.8, 13); c.beginPath(); c.moveTo(17.4, 6.5); c.lineTo(18.3, 4); c.lineTo(19.2, 6.5); c.closePath(); c.fill();
      c.fillStyle = bg; c.beginPath(); c.arc(11, 19.5, 1.7, Math.PI, 0); c.fill();
    },
    fire(c, ink) {
      c.fillStyle = ink; c.beginPath();
      c.moveTo(12, 4); c.bezierCurveTo(16, 8, 18, 11, 18, 14.5); c.bezierCurveTo(18, 18, 15, 20, 12, 20);
      c.bezierCurveTo(9, 20, 6, 18, 6, 14.5); c.bezierCurveTo(6, 12, 7.5, 10.5, 9, 9);
      c.bezierCurveTo(9.2, 11, 10, 11.5, 10.7, 11.5); c.bezierCurveTo(10.5, 8.5, 11, 6, 12, 4); c.closePath(); c.fill();
    },
    train(c, ink, bg) {
      c.fillStyle = ink;
      c.fillRect(4.6, 9.5, 10.4, 6.5); c.fillRect(14, 6.5, 5.4, 9.5); c.fillRect(6.4, 6, 2, 3.6);
      c.beginPath(); c.arc(8, 17.6, 1.9, 0, TAU); c.arc(12.4, 17.6, 1.9, 0, TAU); c.arc(17, 17.6, 1.9, 0, TAU); c.fill();
      c.fillStyle = bg; c.fillRect(15.4, 8, 2.6, 2.6);
    },
    bus(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(7.4, 5.5); c.lineTo(16.6, 5.5); c.quadraticCurveTo(18, 5.5, 18, 7); c.lineTo(18, 17.4); c.lineTo(6, 17.4); c.lineTo(6, 7); c.quadraticCurveTo(6, 5.5, 7.4, 5.5); c.fill();
      c.fillRect(7, 17.4, 2.2, 2.2); c.fillRect(14.8, 17.4, 2.2, 2.2);
      c.fillStyle = bg; c.fillRect(7.4, 7.2, 9.2, 4.2); c.fillRect(7.6, 13.6, 1.8, 1.6); c.fillRect(14.6, 13.6, 1.8, 1.6);
    },
    tree(c, ink) {
      c.fillStyle = ink;
      [[4.2, 11.2, 12], [8.6, 16, 6]].forEach(([top, bot, hw]) => {
        c.beginPath(); c.moveTo(12, top); c.lineTo(12 + hw / 2 + 0.6, bot); c.lineTo(12 - hw / 2 - 0.6, bot); c.closePath(); c.fill();
      });
      c.fillRect(11, 16, 2, 4);
    },
    landmark(c, ink, bg) {
      c.fillStyle = ink;
      c.beginPath(); c.moveTo(12, 3.8); c.lineTo(16, 12); c.lineTo(12, 20.2); c.lineTo(8, 12); c.closePath(); c.fill();
      c.fillStyle = bg; c.beginPath(); c.arc(12, 12, 1.6, 0, TAU); c.fill();
    },
    grave(c, ink) {
      c.fillStyle = ink;
      c.beginPath(); c.arc(12, 11, 4.2, Math.PI, 0); c.lineTo(16.2, 19.5); c.lineTo(7.8, 19.5); c.closePath(); c.fill();
    },
  };

  // ---- Sınıf/alt sınıf → simge eşlemesi ----
  const MAP = {
    hospital:   ['hospital', 'clinic', 'doctors', 'dentist', 'healthcare'],
    pharmacy:   ['pharmacy', 'chemist'],
    police:     ['police'],
    clothes:    ['clothing_store', 'clothes', 'boutique', 'shoes', 'tailor', 'fashion', 'fabric'],
    barber:     ['hairdresser', 'barber', 'beauty'],
    bank:       ['bank'],
    coin:       ['atm', 'bureau_de_change'],
    restaurant: ['restaurant', 'fast_food', 'food_court', 'ice_cream'],
    cafe:       ['cafe', 'coffee', 'bakery', 'pastry'],
    bar:        ['bar', 'pub', 'beer', 'biergarten', 'nightclub', 'alcohol_shop', 'wine'],
    shop:       ['grocery', 'supermarket', 'convenience', 'shop', 'marketplace', 'mall', 'department_store', 'butcher', 'greengrocer', 'deli', 'kiosk', 'general', 'hardware', 'florist', 'furniture'],
    post:       ['post', 'post_office'],
    fuel:       ['fuel', 'charging_station'],
    lodging:    ['lodging', 'hotel', 'motel', 'hostel', 'guest_house'],
    book:       ['library', 'school', 'college', 'university', 'kindergarten'],
    church:     ['place_of_worship', 'church', 'chapel', 'temple'],
    mosque:     ['mosque'],
    fire:       ['fire_station'],
    train:      ['railway', 'rail', 'station', 'subway', 'tram_stop', 'halt'],
    bus:        ['bus', 'bus_stop', 'bus_station'],
    tree:       ['park', 'garden', 'playground', 'camp_site', 'campsite', 'picnic_site', 'zoo'],
    landmark:   ['attraction', 'museum', 'art_gallery', 'castle', 'monument', 'memorial', 'viewpoint', 'theatre', 'cinema', 'stadium', 'harbor', 'town_hall'],
    grave:      ['cemetery', 'grave_yard'],
  };

  const THEMES = {
    day:   { badge: '#4a3320', ring: '#e3d3a8', ink: '#eadfbe', bg: '#4a3320' },
    night: { badge: '#cbb68a', ring: '#1b1713', ink: '#241d15', bg: '#cbb68a' },
  };

  const PX = 2;          // pixelRatio
  const CSS_SIZE = 26;   // ekranda piksel

  function render(name, theme) {
    const t = THEMES[theme];
    const px = CSS_SIZE * PX;
    const cv = document.createElement('canvas');
    cv.width = cv.height = px;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.scale(px / 24, px / 24);
    // rozet: dış halka + dolgu
    c.beginPath(); c.arc(12, 12, 11.4, 0, TAU); c.fillStyle = t.ring; c.fill();
    c.beginPath(); c.arc(12, 12, 10.2, 0, TAU); c.fillStyle = t.badge; c.fill();
    c.save();
    c.translate(12, 12); c.scale(0.82, 0.82); c.translate(-12, -12);
    G[name](c, t.ink, t.bg);
    c.restore();
    return c.getImageData(0, 0, px, px);
  }

  const cache = { day: {}, night: {} };
  function ensure(theme) {
    if (cache[theme].ready) return;
    Object.keys(MAP).forEach((k) => { cache[theme][k] = render(k, theme); });
    cache[theme].ready = true;
  }

  window.RDRIcons = {
    MAP,
    names: Object.keys(MAP),
    // açıklama paneli için: simgeyi data URL olarak ver
    dataURL(name, theme) {
      ensure(theme);
      const img = cache[theme][name];
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      cv.getContext('2d').putImageData(img, 0, 0);
      return cv.toDataURL('image/png');
    },
    // her iki temada da aynı addan eklenir; tema değişince setStyle sonrası yeniden çağrılır
    addTo(map, theme) {
      ensure(theme);
      Object.keys(MAP).forEach((k) => {
        const id = 'ic-' + k;
        if (map.hasImage(id)) map.removeImage(id);
        map.addImage(id, cache[theme][k], { pixelRatio: PX });
      });
    },
  };
})();
