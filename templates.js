/* Photocard Studio — template definitions
 * Each template renders a 1080 x 1080 card.
 * Placeholders use {{key}} and are replaced in app.js.
 */

export const fonts = [
  { id: 'inter',       name: 'Inter',              stack: "'Inter', system-ui, sans-serif" },
  { id: 'poppins',     name: 'Poppins',            stack: "'Poppins', system-ui, sans-serif" },
  { id: 'oswald',      name: 'Oswald',             stack: "'Oswald', Impact, sans-serif" },
  { id: 'bebas',       name: 'Bebas Neue',         stack: "'Bebas Neue', Impact, sans-serif" },
  { id: 'playfair',    name: 'Playfair Display',   stack: "'Playfair Display', Georgia, serif" },
  { id: 'lora',        name: 'Lora',               stack: "'Lora', Georgia, serif" },
  { id: 'merriweather',name: 'Merriweather',       stack: "'Merriweather', Georgia, serif" },
  { id: 'hind',        name: 'Hind Siliguri',      stack: "'Hind Siliguri', system-ui, sans-serif", bengali: true },
  { id: 'noto-bn',     name: 'Noto Serif Bengali', stack: "'Noto Serif Bengali', Georgia, serif",  bengali: true },
  { id: 'baloo',       name: 'Baloo Da 2',         stack: "'Baloo Da 2', system-ui, sans-serif",   bengali: true },
  { id: 'anek',        name: 'Anek Bangla',        stack: "'Anek Bangla', system-ui, sans-serif",  bengali: true }
];

export const baseCss = `
.card {
  position: relative;
  width: 1080px;
  height: 1080px;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
}
.card *, .card *::before, .card *::after { box-sizing: border-box; margin: 0; padding: 0; }
.card img { display: block; }
.card .main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
}
.card .logo-wrap { display: flex; align-items: center; justify-content: center; }
.card .logo-wrap img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
.card:not(.has-logo) .logo-wrap { display: none !important; }
.card.is-bengali [data-fit] { line-height: 1.34; }

/* Optional sponsor banner (110px strip at the bottom) */
.card .ad-band {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 42px 12px;
  background: var(--bg);
  border-top: 1px solid rgba(128, 128, 128, .28);
  z-index: 20;
}
.card .ad-band::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--accent);
}
.card .ad-band img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
.card:not(.has-ad) .ad-band { display: none !important; }

.card.has-ad.t-banglatopic .bt-tagline-wrap { display: none; }
.card.has-ad.t-banglatopic .bt-footer { bottom: 130px; }
`;

export const templates = [
  {
    id: 'banglatopic',
    name: 'BanglaTopic',
    tag: 'Brand',
    height: 1350,
    description: 'A brand card in the BanglaTopic style: full-width photo, red category badge, large centred Bangla headline and the wordmark. Exports at 1080 × 1350 (4:5).',
    defaults: { accent: '#E10600', bg: '#080808', text: '#FFFFFF', font: 'hind' },
    fields: [
      { key: 'category', label: 'Category badge', type: 'text' },
      { key: 'heading', label: 'Headline', type: 'textarea', rows: 4 },
      { key: 'cta', label: 'Call to action', type: 'text' },
      { key: 'domain', label: 'Domain', type: 'text' },
      { key: 'tagline', label: 'Bottom tagline', type: 'text' }
    ],
    values: {
      category: 'Sports',
      heading: 'বিশ্বকাপ ফাইনালে হারলেও বছরের পারফরম্যান্সে সন্তুষ্টই আর্জেন্টিনা কোচ স্কালোনি',
      cta: 'বিস্তারিত কমেন্টে...',
      domain: 'www.banglatopic.com',
      tagline: 'বাংলায় জানুন জানা-অজানা সব টপিক!'
    },
    html: `
      <div class="card t-banglatopic">
        <div class="bt-photo"><img class="main-image" src="{{image}}" alt=""></div>
        <div class="bt-badge-row"><span class="bt-badge">{{category}}</span></div>
        <div class="bt-glow"></div>
        <div class="bt-title-wrap">
          <h1 class="bt-title" data-fit>{{heading}}</h1>
        </div>
        <div class="bt-footer">
          <div class="bt-left">
            <span class="bt-cta">{{cta}}</span>
            <span class="bt-domain">{{domain}}</span>
          </div>
          <div class="bt-brand">
            <span class="logo-wrap bt-logo"><img src="{{logo}}" alt=""></span>
            <span class="bt-fallback">
              <span class="bt-mark">ব</span>
              <span class="bt-name">বাংলা</span>
              <span class="bt-topic">Topic</span>
            </span>
          </div>
        </div>
        <div class="bt-tagline-wrap"><span class="bt-tagline">{{tagline}}</span></div>
      </div>`,
    css: `
      .t-banglatopic { background: #080808; color: #fff; }
      .t-banglatopic .bt-photo { position: absolute; top: 0; left: 0; width: 100%; height: 620px; overflow: hidden; background: #151515; }
      .t-banglatopic .bt-badge-row { position: absolute; top: 596px; left: 0; right: 0; text-align: center; z-index: 3; }
      .t-banglatopic .bt-badge { display: inline-block; background: var(--accent); color: #fff; font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; padding: 10px 26px 9px; }
      .t-banglatopic .bt-glow { position: absolute; left: 0; right: 0; bottom: 0; height: 880px; background: radial-gradient(ellipse at 50% 98%, rgba(190,0,0,.5) 0%, rgba(120,0,0,.16) 48%, rgba(0,0,0,0) 74%); z-index: 1; }
      .t-banglatopic .bt-title-wrap { position: absolute; top: 676px; left: 70px; right: 70px; bottom: 258px; z-index: 2; display: flex; align-items: center; justify-content: center; }
      .card.t-banglatopic .bt-title { width: 100%; font-size: 56px; line-height: 1.5; font-weight: 700; letter-spacing: -.01em; text-align: center; max-height: 380px; overflow: hidden; }
      .t-banglatopic .bt-footer { position: absolute; left: 56px; right: 56px; bottom: 124px; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; }
      .t-banglatopic .bt-left { display: flex; flex-direction: column; align-items: flex-start; }
      .t-banglatopic .bt-cta { display: inline-block; background: var(--accent); color: #fff; font-size: 21px; font-weight: 600; line-height: 1; padding: 10px 20px 9px; border-radius: 999px; }
      .t-banglatopic .bt-domain { margin-top: 18px; font-family: 'Inter', sans-serif; font-size: 27px; font-weight: 500; letter-spacing: .01em; }
      .t-banglatopic .bt-brand { display: flex; align-items: center; }
      .t-banglatopic .bt-logo { height: 64px; max-width: 300px; }
      .t-banglatopic .bt-logo img { height: 64px; width: auto; }
      .t-banglatopic .bt-fallback { display: flex; align-items: center; }
      .t-banglatopic .bt-mark { width: 56px; height: 56px; border-radius: 14px; background: var(--accent); color: #fff; display: grid; place-items: center; font-size: 28px; font-weight: 800; margin-right: 14px; }
      .t-banglatopic .bt-name { font-size: 38px; font-weight: 700; }
      .t-banglatopic .bt-topic { margin-left: 9px; background: var(--accent); color: #fff; font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 800; padding: 1px 10px 4px; border-radius: 2px; }
      .t-banglatopic .bt-tagline-wrap { position: absolute; left: 0; right: 0; bottom: 0; height: 104px; z-index: 2; border-top: 1px solid rgba(255,255,255,.16); display: flex; align-items: center; justify-content: center; }
      .t-banglatopic .bt-tagline { font-size: 25px; font-weight: 500; color: rgba(255,255,255,.92); letter-spacing: .01em; }
      .t-banglatopic.has-logo .bt-fallback { display: none; }
    `
  }
];
