# Harita — Eski Zaman

Gerçek dünya haritası, eski zaman parşömen görünümünde. Kişisel kullanım için.
Veri: OpenStreetMap, OpenFreeMap, OpenMapTiles (anahtar gerektirmez, ücretsiz).

## GitHub Pages ile yayınlama (telefonda kullanmak için)

1. GitHub'da yeni bir repo aç (ör. `harita`). Gizli (private) olabilir, ama Pages için hesabının private repo'da Pages'i desteklemesi gerekir; olmazsa public aç.
2. Bu klasörün **içindekileri** (index.html, app.js, vendor/, icons/ …) repo'nun köküne yükle.
3. Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. Bir iki dakika sonra `https://KULLANICI_ADIN.github.io/harita/` adresi açılır.
5. Telefonda bu adresi aç:
   - iPhone: Safari → Paylaş → **Ana Ekrana Ekle**
   - Android: Chrome → ⋮ → **Ana ekrana ekle / Uygulamayı yükle**
6. İlk açılışta konum düğmesine basınca konum izni ister (GPS yalnızca HTTPS'te çalışır, Pages bunu sağlar).

## Bilgisayarda denemek için

```
cd klasör
python3 -m http.server 8000
```
Sonra tarayıcıda `http://localhost:8000` (localhost'ta konum da çalışır).

## Dosyalar

- `index.html` — arayüz ve parşömen dokusu (CSS)
- `style.js` — harita stili (renkler, yollar, etiketler; gündüz/gece paletleri burada)
- `icons.js` — mekân simgeleri ve hangi OSM türünün hangi simgeye denk geldiği (`MAP`)
- `app.js` — konum, arama, tema, simge rehberi
- `sw.js`, `manifest.webmanifest` — PWA (ana ekrana ekleme, harita karolarını önbellekleme)
- `vendor/` — MapLibre GL JS 5.24.1 (BSD-3)

## Ayarlama

- Renkleri değiştirmek: `style.js` başındaki `PALETTES`.
- Yeni mekân türü eklemek: `icons.js` içindeki `MAP` listesine OSM değerini ekle.
- Simgeler ve harita görünümü özgün çizimdir; oyundan alınmış görsel yoktur.
