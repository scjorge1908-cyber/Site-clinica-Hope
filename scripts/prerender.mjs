/**
 * Pré-renderização para SEO e IAs (Google, ChatGPT, Claude, Perplexity, Gemini).
 *
 * Roda DEPOIS do `vite build` (no GitHub Actions). Busca os dados públicos do
 * Firestore (especialistas, abordagens, convênios, artigos, textos da home) e
 * grava páginas HTML com o conteúdo já escrito, para robôs que não executam
 * JavaScript. Para o visitante nada muda: o React carrega e substitui esse
 * conteúdo pelos dados ao vivo do Firebase.
 *
 * Gera em dist/:
 *   index.html, especialistas.html, abordagens.html, psicoeducacao.html,
 *   <slug-do-especialista>.html, sitemap.xml, llms.txt
 *
 * Se o Firebase não responder, o script avisa e NÃO quebra o deploy
 * (o site continua funcionando como antes, com os arquivos estáticos de public/).
 *
 * Teste local sem internet: PRERENDER_MOCK=caminho/dados.json node scripts/prerender.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://clinicahopebrasil.com.br';

// ── Dados fixos da clínica (fonte: informados pela administração) ─────────────
const CLINIC = {
  name: 'Clínica Hope',
  legalName: 'Hope Clínica Multidisciplinar LTDA',
  phoneDisplay: '(48) 9 9838-5204',
  phoneIntl: '+55-48-99838-5204',
  whatsappUrl: 'https://wa.me/554898385204?text=' + encodeURIComponent('Olá, estou vindo pelo site da Hope clinicahopebrasil.com.br e gostaria de agendar uma consulta'),
  telegramUrl: 'https://t.me/+5548998385204?text=' + encodeURIComponent('Olá, estou vindo pelo site da Hope clinicahopebrasil.com.br e gostaria de agendar uma consulta'),
  street: 'Rua Najla Carone Guedert, 1080 - City Office Square',
  district: 'Pagani',
  city: 'Palhoça',
  state: 'SC',
  cep: '88132-150',
  mapUrl: 'https://share.google/H7jE0WoO7hD0aYzQ2',
  hoursText: 'Segunda a sexta, das 7h às 22h. Sábado, das 7h às 14h.',
  audienceText: 'Crianças a partir de 3 anos, adolescentes e adultos (até 85 anos).',
  heroTitle: 'Clínica de Psicologia em Palhoça',
  heroText: 'Oferecemos um espaço seguro e acolhedor para o seu desenvolvimento emocional em Palhoça. Um convite ao reencontro com sua essência.',
};
const FULL_ADDRESS = `${CLINIC.street}, ${CLINIC.district}, ${CLINIC.city} - ${CLINIC.state}, CEP ${CLINIC.cep}`;
const RESERVED = new Set(['index', 'especialistas', 'corpoclinico', 'sublocacao', 'administracao', 'admin', 'login', 'seo', 'abordagens', 'psicoeducacao', 'agendamento', 'home', '404', 'assets', 'sitemap', 'robots', 'llms']);

// ── Firestore REST (somente leitura pública) ─────────────────────────────────
function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

async function loadFromFirestore() {
  const cfg = JSON.parse(await fs.readFile(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));
  const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;
  const mask = (fields) => fields.map((f) => `mask.fieldPaths=${encodeURIComponent(f)}`).join('&');

  async function getJson(url) {
    // Referer do site: necessário se a chave do Firebase estiver restrita ao domínio da clínica.
    const res = await fetch(url, { headers: { Accept: 'application/json', Referer: `${SITE}/` } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} em ${url.split('?')[0]}`);
    return res.json();
  }
  async function list(collection, fields) {
    const docs = [];
    let pageToken = '';
    for (let i = 0; i < 20; i++) {
      const url = `${base}/${collection}?pageSize=300&${mask(fields)}&key=${cfg.apiKey}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const json = await getJson(url);
      for (const d of json.documents || []) docs.push({ id: d.name.split('/').pop(), ...decodeFields(d.fields) });
      if (!json.nextPageToken) break;
      pageToken = json.nextPageToken;
    }
    return docs;
  }
  async function getDoc(docPath, fields) {
    const json = await getJson(`${base}/${docPath}?${mask(fields)}&key=${cfg.apiKey}`);
    return decodeFields(json.fields);
  }
  async function safe(label, fn, fallback) {
    try { return await fn(); } catch (e) { console.warn(`[prerender] Aviso: não foi possível ler ${label}: ${e.message}`); return fallback; }
  }

  const settings = await safe('settings/home', () => getDoc('settings/home', ['clinicName', 'heroTitle', 'heroSubtitle', 'heroText', 'seoTitle', 'seoText', 'insurancePlans']), {});
  const specialists = await safe('specialists', () => list('specialists', ['name', 'crp', 'councilType', 'customCouncil', 'noCouncil', 'spec', 'tags', 'desc', 'ageGroups', 'shifts', 'insurancePlans', 'slug']), []);
  const approaches = await safe('approaches', () => list('approaches', ['title', 'desc', 'details']), []);
  const insurance = await safe('insurance_plans', () => list('insurance_plans', ['name']), []);
  const articles = await safe('psicoeducacao_articles', () => list('psicoeducacao_articles', ['title', 'subtitle', 'content', 'createdAt', 'updatedAt']), []);
  return { settings, specialists, approaches, insurance, articles };
}

// ── Utilidades de texto/HTML ─────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => String(s ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/[*_#>`]/g, '').replace(/&nbsp;/g, ' ').trim();
const clip = (s, n) => { const t = stripTags(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
const paragraphs = (s) => stripTags(s).split(/\n{1,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('\n');
const isValidSlug = (slug) => typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) && !RESERVED.has(slug.toLowerCase());
const councilLabel = (s) => {
  if (s.noCouncil || !s.crp) return '';
  const type = s.councilType === 'Outro' ? (s.customCouncil || 'Registro') : (s.councilType || 'CRP');
  return `${type} ${s.crp}`;
};
const joinPt = (items) => {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
};

// ── Estrutura comum das páginas estáticas ────────────────────────────────────
const STYLE = `<style>
.ssr{font-family:Manrope,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2a3a;max-width:960px;margin:0 auto;padding:24px 16px 64px;line-height:1.6}
.ssr a{color:#0d4f7c}.ssr nav{display:flex;flex-wrap:wrap;gap:16px;font-weight:700;margin-bottom:32px}
.ssr h1{font-size:2rem;line-height:1.15;color:#0f3d63;margin:0 0 12px}.ssr h2{font-size:1.35rem;color:#0f3d63;margin:40px 0 12px}
.ssr h3{font-size:1.05rem;margin:20px 0 4px}.ssr ul{padding-left:20px}.ssr .ssr-cta{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}
.ssr .ssr-cta a{padding:10px 16px;border-radius:12px;font-weight:700;text-decoration:none;color:#fff;background:#0f3d63}
.ssr .ssr-cta a.wa{background:#1a7f43}.ssr .ssr-cta a.tg{background:#006fa6}.ssr .ssr-muted{color:#4a5a6a;font-size:.95rem}
.ssr dt{font-weight:700;margin-top:14px}.ssr dd{margin:4px 0 0}
</style>`;

function nav() {
  return `<nav aria-label="Navegação principal">
<a href="/">Início</a><a href="/especialistas">Especialistas</a><a href="/abordagens">Abordagens</a><a href="/psicoeducacao">Psicoeducação</a>
</nav>`;
}
function ctas() {
  return `<div class="ssr-cta">
<a class="wa" href="${esc(CLINIC.whatsappUrl)}" rel="noopener">Agendar pelo WhatsApp</a>
<a class="tg" href="${esc(CLINIC.telegramUrl)}" rel="noopener">Agendar pelo Telegram</a>
</div>`;
}
function contactBlock() {
  return `<section aria-labelledby="ssr-contato">
<h2 id="ssr-contato">Endereço, horário e contato</h2>
<address style="font-style:normal">
<p><strong>${esc(CLINIC.name)}</strong><br>${esc(CLINIC.street)}<br>${esc(CLINIC.district)}, ${esc(CLINIC.city)} - ${esc(CLINIC.state)}, CEP ${esc(CLINIC.cep)}</p>
<p>Telefone e WhatsApp: <a href="tel:+5548998385204">${esc(CLINIC.phoneDisplay)}</a></p>
<p>Horário de atendimento: ${esc(CLINIC.hoursText)}</p>
<p><a href="${esc(CLINIC.mapUrl)}" rel="noopener">Ver no Google Maps</a></p>
</address>
${ctas()}
</section>`;
}
function footer() {
  return `<footer class="ssr-muted" style="margin-top:48px">
<p>${esc(CLINIC.name)} · ${esc(FULL_ADDRESS)} · ${esc(CLINIC.phoneDisplay)}</p>
</footer>`;
}
function wrap(inner) {
  return `${STYLE}<div class="ssr">${nav()}\n${inner}\n${footer()}</div>`;
}

const clinicRef = { '@type': 'MedicalClinic', '@id': `${SITE}/#clinica`, name: CLINIC.name, url: SITE };

function specialistCard(s, plansById) {
  const council = councilLabel(s);
  const plans = (s.insurancePlans || []).map((id) => plansById.get(id)).filter(Boolean);
  const link = isValidSlug(s.slug) ? `/${s.slug}` : '/especialistas';
  return `<article>
<h3><a href="${esc(link)}">${esc(s.name)}</a></h3>
<p class="ssr-muted">${esc([s.spec, council].filter(Boolean).join(' · '))}</p>
${s.desc ? `<p>${esc(clip(s.desc, 280))}</p>` : ''}
${(s.ageGroups || []).length ? `<p>Atende: ${esc(joinPt(s.ageGroups))}.</p>` : ''}
${plans.length ? `<p>Convênios: ${esc(joinPt(plans))}.</p>` : ''}
</article>`;
}

// ── Montagem das páginas ─────────────────────────────────────────────────────
function buildPages(data) {
  const { settings = {}, approaches = [], articles = [] } = data;
  const specialists = (data.specialists || []).filter((s) => s && s.name);

  // Convênios: coleção insurance_plans + os da home (mesmo id), sem duplicar nomes.
  const plansById = new Map();
  for (const p of [...(settings.insurancePlans || []), ...(data.insurance || [])]) {
    if (p && p.id && p.name && !plansById.has(p.id)) plansById.set(p.id, p.name);
  }
  const planNames = [...new Set([...plansById.values()])];

  const heroTitle = settings.heroTitle || CLINIC.heroTitle;
  const heroText = settings.heroText || CLINIC.heroText;
  const specialistNames = specialists.map((s) => s.name);

  const faq = [
    ['Onde fica a Clínica Hope?', `A Clínica Hope fica na ${FULL_ADDRESS}.`],
    ['Qual é o horário de atendimento da Clínica Hope?', CLINIC.hoursText],
    ['A Clínica Hope atende quais idades?', `Atendemos ${CLINIC.audienceText.charAt(0).toLowerCase()}${CLINIC.audienceText.slice(1)}`],
    ['Como agendar uma consulta na Clínica Hope?', `Pelo WhatsApp ou Telegram no número ${CLINIC.phoneDisplay}, ou pelo site clinicahopebrasil.com.br escolhendo o(a) especialista.`],
  ];
  if (planNames.length) faq.push(['Quais convênios a Clínica Hope aceita?', `${joinPt(planNames)}.`]);
  if (specialistNames.length) faq.push(['Quem são os profissionais da Clínica Hope?', `${joinPt(specialistNames)}.`]);

  const pages = [];

  // Início
  pages.push({
    file: 'index.html',
    url: `${SITE}/`,
    title: 'Clínica Hope | Clínica de Psicologia em Palhoça - SC',
    description: `Clínica de psicologia no Pagani, Palhoça - SC. Atendimento para crianças a partir de 3 anos, adolescentes e adultos. Agende pelo WhatsApp ${CLINIC.phoneDisplay}.`,
    body: wrap(`<header>
<p class="ssr-muted">Bem-vindo à ${esc(CLINIC.name)}</p>
<h1>${esc(heroTitle)}</h1>
<p>${esc(heroText)}</p>
${ctas()}
</header>
<section aria-labelledby="ssr-publico"><h2 id="ssr-publico">Para quem é o atendimento</h2><p>${esc(CLINIC.audienceText)}</p></section>
${specialists.length ? `<section aria-labelledby="ssr-esp"><h2 id="ssr-esp">Nossos especialistas</h2>\n${specialists.map((s) => specialistCard(s, plansById)).join('\n')}\n<p><a href="/especialistas">Ver todos os especialistas</a></p></section>` : ''}
${approaches.length ? `<section aria-labelledby="ssr-abord"><h2 id="ssr-abord">Abordagens terapêuticas</h2><ul>${approaches.map((a) => `<li><strong>${esc(a.title)}</strong>${a.desc ? ` — ${esc(clip(a.desc, 200))}` : ''}</li>`).join('')}</ul><p><a href="/abordagens">Saiba mais sobre as abordagens</a></p></section>` : ''}
${planNames.length ? `<section aria-labelledby="ssr-conv"><h2 id="ssr-conv">Convênios aceitos</h2><ul>${planNames.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}
${settings.seoTitle || settings.seoText ? `<section><h2>${esc(settings.seoTitle || 'Sobre a clínica')}</h2>${paragraphs(settings.seoText || '')}</section>` : ''}
${contactBlock()}
<section aria-labelledby="ssr-faq"><h2 id="ssr-faq">Perguntas frequentes</h2><dl>${faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl></section>`),
    jsonld: [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    }],
  });

  // Especialistas
  pages.push({
    file: 'especialistas.html',
    url: `${SITE}/especialistas`,
    title: 'Psicólogos em Palhoça | Especialistas da Clínica Hope',
    description: `Conheça os especialistas da Clínica Hope em Palhoça - SC${specialistNames.length ? `: ${clip(joinPt(specialistNames), 110)}` : ''}. Agende pelo WhatsApp ${CLINIC.phoneDisplay}.`,
    body: wrap(`<h1>Especialistas da Clínica Hope em Palhoça</h1>
<p>${esc(CLINIC.audienceText)}</p>
${specialists.map((s) => specialistCard(s, plansById)).join('\n') || '<p>Consulte nossa equipe pelo WhatsApp.</p>'}
${contactBlock()}`),
    jsonld: [],
  });

  // Página de cada especialista
  for (const s of specialists) {
    if (!isValidSlug(s.slug)) continue;
    const council = councilLabel(s);
    const plans = (s.insurancePlans || []).map((id) => plansById.get(id)).filter(Boolean);
    pages.push({
      file: `${s.slug}.html`,
      url: `${SITE}/${s.slug}`,
      title: `${s.name}${s.spec ? ` - ${s.spec}` : ''} em Palhoça | Clínica Hope`,
      description: clip(`${s.name}${council ? ` (${council})` : ''}${s.spec ? `, ${s.spec}` : ''} na Clínica Hope, Pagani, Palhoça - SC. ${s.desc || ''}`, 158),
      body: wrap(`<article>
<h1>${esc(s.name)}</h1>
<p class="ssr-muted">${esc([s.spec, council].filter(Boolean).join(' · '))} · ${esc(CLINIC.name)}, ${esc(CLINIC.city)} - ${esc(CLINIC.state)}</p>
${paragraphs(s.desc || '')}
${(s.tags || []).length ? `<h2>Áreas de atuação</h2><ul>${s.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
${(s.ageGroups || []).length ? `<h2>Público atendido</h2><p>${esc(joinPt(s.ageGroups))}.</p>` : ''}
${(s.shifts || []).length ? `<h2>Turnos de atendimento</h2><p>${esc(joinPt(s.shifts))}.</p>` : ''}
${plans.length ? `<h2>Convênios</h2><ul>${plans.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
</article>
<p><a href="/especialistas">Ver todos os especialistas</a></p>
${contactBlock()}`),
      jsonld: [{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: s.name,
        url: `${SITE}/${s.slug}`,
        ...(s.spec ? { jobTitle: s.spec } : {}),
        ...(council ? { identifier: council } : {}),
        ...((s.tags || []).length ? { knowsAbout: s.tags } : {}),
        ...(s.desc ? { description: clip(s.desc, 300) } : {}),
        worksFor: clinicRef,
        workLocation: { '@type': 'Place', name: CLINIC.name, address: FULL_ADDRESS },
      }],
    });
  }

  // Abordagens
  pages.push({
    file: 'abordagens.html',
    url: `${SITE}/abordagens`,
    title: 'Abordagens Terapêuticas | Clínica Hope Palhoça',
    description: clip(`Abordagens terapêuticas oferecidas na Clínica Hope, em Palhoça - SC${approaches.length ? `: ${joinPt(approaches.map((a) => a.title))}` : ''}.`, 158),
    body: wrap(`<h1>Abordagens terapêuticas na Clínica Hope</h1>
${approaches.map((a) => `<section><h2>${esc(a.title)}</h2>${paragraphs(a.desc || '')}${paragraphs(a.details || '')}</section>`).join('\n') || '<p>Consulte as abordagens pelo WhatsApp.</p>'}
${contactBlock()}`),
    jsonld: [],
  });

  // Psicoeducação
  const sortedArticles = [...articles].filter((a) => a && a.title).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  pages.push({
    file: 'psicoeducacao.html',
    url: `${SITE}/psicoeducacao`,
    title: 'Psicoeducação | Artigos sobre Saúde Mental - Clínica Hope',
    description: clip(`Artigos de psicoeducação da Clínica Hope, clínica de psicologia em Palhoça - SC${sortedArticles.length ? `: ${sortedArticles.slice(0, 3).map((a) => a.title).join(', ')}` : ''}.`, 158),
    body: wrap(`<h1>Psicoeducação</h1>
<p>Conteúdos da Clínica Hope sobre saúde mental e desenvolvimento emocional.</p>
${sortedArticles.map((a) => `<article><h2>${esc(a.title)}</h2>${a.subtitle ? `<p class="ssr-muted">${esc(a.subtitle)}</p>` : ''}${paragraphs(a.content || '')}</article>`).join('\n')}
${contactBlock()}`),
    jsonld: sortedArticles.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: sortedArticles.map((a, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Article', headline: a.title, ...(a.subtitle ? { description: a.subtitle } : {}), author: clinicRef, publisher: clinicRef } })),
    }] : [],
  });

  return { pages, specialists, approaches, planNames, articles: sortedArticles };
}

// ── Aplicar no template gerado pelo Vite ─────────────────────────────────────
function setAttr(html, regex, value) {
  return regex.test(html) ? html.replace(regex, (_m, pre, post) => `${pre}${esc(value)}${post}`) : html;
}
function renderPage(template, page) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setAttr(html, /(<meta name="description" content=")[^"]*(")/, page.description);
  html = setAttr(html, /(<link rel="canonical" href=")[^"]*(")/, page.url);
  html = setAttr(html, /(<meta property="og:url" content=")[^"]*(")/, page.url);
  html = setAttr(html, /(<meta property="og:title" content=")[^"]*(")/, page.title);
  html = setAttr(html, /(<meta property="og:description" content=")[^"]*(")/, page.description);
  html = setAttr(html, /(<meta name="twitter:title" content=")[^"]*(")/, page.title);
  html = setAttr(html, /(<meta name="twitter:description" content=")[^"]*(")/, page.description);
  // Caminhos absolutos para os arquivos do Vite (base './'), seguro em qualquer rota.
  html = html.replace(/(src|href)="\.\/assets\//g, '$1="/assets/');
  const ld = (page.jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n    ');
  if (ld) html = html.replace('</head>', `    ${ld}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
  return html;
}

function buildSitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.map((p) => `  <url><loc>${esc(p.url)}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildLlmsTxt({ specialists, approaches, planNames, articles }) {
  const lines = [
    '# Clínica Hope — Clínica de Psicologia em Palhoça (SC)',
    '',
    `> ${CLINIC.heroText}`,
    '',
    '## Informações da clínica',
    `- Nome: ${CLINIC.name} (${CLINIC.legalName})`,
    `- Endereço: ${FULL_ADDRESS}`,
    `- Telefone e WhatsApp: ${CLINIC.phoneDisplay}`,
    `- Horário: ${CLINIC.hoursText}`,
    `- Público atendido: ${CLINIC.audienceText}`,
    `- Agendamento: WhatsApp ou Telegram no ${CLINIC.phoneDisplay}, ou pelo site ${SITE}`,
    `- Mapa: ${CLINIC.mapUrl}`,
    '',
  ];
  if (planNames.length) lines.push('## Convênios aceitos', ...planNames.map((n) => `- ${n}`), '');
  if (specialists.length) {
    lines.push('## Especialistas');
    for (const s of specialists) {
      const council = councilLabel(s);
      const url = isValidSlug(s.slug) ? `${SITE}/${s.slug}` : `${SITE}/especialistas`;
      const extra = [s.spec, council, (s.ageGroups || []).length ? `atende ${joinPt(s.ageGroups).toLowerCase()}` : ''].filter(Boolean).join('; ');
      lines.push(`- [${s.name}](${url})${extra ? `: ${extra}` : ''}`);
    }
    lines.push('');
  }
  if (approaches.length) lines.push('## Abordagens terapêuticas', ...approaches.map((a) => `- ${a.title}${a.desc ? `: ${clip(a.desc, 160)}` : ''}`), '');
  lines.push('## Páginas', `- [Início](${SITE}/)`, `- [Especialistas](${SITE}/especialistas)`, `- [Abordagens](${SITE}/abordagens)`, `- [Psicoeducação](${SITE}/psicoeducacao)${articles.length ? ` — ${articles.length} artigo(s)` : ''}`, '');
  return lines.join('\n');
}

// ── Execução ─────────────────────────────────────────────────────────────────
async function main() {
  const templatePath = path.join(DIST, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8');
  if (!template.includes('<div id="root"></div>')) {
    console.warn('[prerender] dist/index.html já foi pré-renderizado ou mudou de formato. Nada a fazer.');
    return;
  }

  const data = process.env.PRERENDER_MOCK
    ? JSON.parse(await fs.readFile(process.env.PRERENDER_MOCK, 'utf8'))
    : await loadFromFirestore();

  const result = buildPages(data);
  for (const page of result.pages) {
    await fs.writeFile(path.join(DIST, page.file), renderPage(template, page), 'utf8');
  }
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(result.pages), 'utf8');
  await fs.writeFile(path.join(DIST, 'llms.txt'), buildLlmsTxt(result), 'utf8');

  console.log(`[prerender] OK: ${result.pages.length} páginas (${result.specialists.length} especialistas, ${result.approaches.length} abordagens, ${result.planNames.length} convênios, ${result.articles.length} artigos).`);
}

main().catch((e) => {
  console.warn(`[prerender] Aviso: pré-renderização ignorada, site segue normal. Motivo: ${e.message}`);
  process.exit(0);
});
