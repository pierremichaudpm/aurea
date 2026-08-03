const fs = require('fs');
const path = require('path');

// ── Frontmatter parser (no external deps) ─────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    // Block scalar: key: > | >- | | | |-  (folded or literal, optional strip)
    const block = lines[i].match(/^(\w+):\s*([>|])(-?)\s*$/);
    if (block) {
      const [, key, indicator, strip] = block;
      const collected = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
        collected.push(lines[++i].replace(/^\s+/, ''));
      }
      let value = indicator === '>' ? collected.join(' ').replace(/\s+/g, ' ').trim() : collected.join('\n');
      if (strip === '-') value = value.replace(/\n+$/, '');
      data[key] = value;
      continue;
    }
    // Double-quoted multi-line: key: "first part
    //                              continued"
    const openQuote = lines[i].match(/^(\w+):\s*"([^"]*)$/);
    if (openQuote) {
      const [, key, firstPart] = openQuote;
      const parts = [firstPart];
      while (i + 1 < lines.length) {
        const next = lines[++i];
        const closeIdx = next.indexOf('"');
        if (closeIdx >= 0) { parts.push(next.slice(0, closeIdx).replace(/^\s+/, '')); break; }
        parts.push(next.replace(/^\s+/, ''));
      }
      data[key] = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      continue;
    }
    const m = lines[i].match(/^(\w+):\s*(.*)$/);
    if (m) data[m[1]] = stripQuotes(m[2]);
  }
  return { data, content: match[2] };
}

// Strip a single layer of matching quotes ('...' or "...") from a YAML scalar,
// un-escaping doubled '' (single-quote style) since Sveltia/js-yaml emits both forms.
function stripQuotes(str) {
  const trimmed = str.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0], last = trimmed[trimmed.length - 1];
    if (first === '"' && last === '"') return trimmed.slice(1, -1).replace(/\\"/g, '"');
    if (first === "'" && last === "'") return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

// ── Simple Markdown-to-HTML converter (no external deps) ──────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Markdown punctuation that a backslash can escape. Sveltia escapes these on
// its own when the author types them as literal characters, so `\*` reaching
// the page as a visible backslash is a real authoring hazard.
const ESCAPABLE = /\\([\\`*_{}\[\]()#+\-.!>])/g;
const RESTORE_AS_ENTITY = { '>': '&gt;' };

function inlineMarkdown(text, notes) {
  // Stash escaped characters behind a placeholder so the rules below cannot
  // interpret them, then put them back once every rule has run.
  const escaped = [];
  text = text.replace(ESCAPABLE, (m, ch) => '\u0000' + (escaped.push(ch) - 1) + '\u0000');
  // Bold+italic first, otherwise the bold rule eats ***x*** as **, *x, **.
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text** -> <strong>text</strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* -> <em>text</em>. Runs after bold, so the only asterisks
  // left are single ones. Requires a non-space after the opening marker so a
  // stray asterisk stays literal.
  text = text.replace(/\*([^\s*][^*]*?)\*/g, '<em>$1</em>');
  // Italic, underscore form. Bounded by non-word characters so underscores
  // inside a URL or a file name are left alone.
  text = text.replace(/(^|[^\w])_([^\s_][^_]*?)_(?![\w])/g, '$1<em>$2</em>');
  // Escape quotes and apostrophes as HTML entities
  text = text.replace(/\u2019/g, '&#39;');  // right single quotation mark
  text = text.replace(/\u2018/g, '&#39;');  // left single quotation mark
  text = text.replace(/\u201C/g, '&quot;'); // left double quotation mark
  text = text.replace(/\u201D/g, '&quot;'); // right double quotation mark
  text = text.replace(/'/g, '&#39;');
  text = text.replace(/\u00AB/g, '&laquo;'); // «
  text = text.replace(/\u00BB/g, '&raquo;'); // »
  // Links and footnotes last, so the escaping above cannot touch the markup
  // generated here. The link label is already escaped at this point, since the
  // replacements above ran over the whole string including the [label] part.
  text = markdownLinks(text);
  if (notes) text = footnoteRefs(text, notes);
  // Put the escaped characters back, now that no rule can act on them.
  if (escaped.length > 0) {
    text = text.replace(/\u0000(\d+)\u0000/g, (m, n) => {
      const ch = escaped[Number(n)];
      return RESTORE_AS_ENTITY[ch] || ch;
    });
  }
  return text;
}

// Links: [texte](url). Absolute links leave the site, so they open in a new
// tab rather than navigating the reader out of the article panel.
function markdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (literal, label, url) => {
    if (/^\s*javascript:/i.test(url)) return label;
    const href = url.replace(/"/g, '&quot;');
    const attrs = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
}

// -- Footnotes ------------------------------------------------------------
// Syntax: `texte[^1]` in the body, `[^1]: la note` on its own line (usually at
// the end of the article). A definition continues on the following lines until
// a blank line or the next definition, so a long note wrapped by the CMS
// editor still comes through as a single note.
const FOOTNOTE_DEF = /^\[\^([^\]\s]+)\]:\s*(.*)$/;

function extractFootnoteDefs(lines) {
  const defs = new Map();
  const defOrder = [];
  const kept = [];
  let i = 0;
  while (i < lines.length) {
    const match = lines[i].trim().match(FOOTNOTE_DEF);
    if (!match) {
      kept.push(lines[i]);
      i++;
      continue;
    }
    const key = match[1];
    const parts = match[2].trim() ? [match[2].trim()] : [];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === '' || FOOTNOTE_DEF.test(t)) break;
      parts.push(t);
      i++;
    }
    defs.set(key, parts.join(' ').trim());
    defOrder.push(key);
  }
  return { defs, defOrder, lines: kept };
}

function footnoteRefs(text, notes) {
  return text.replace(/\[\^([^\]\s]+)\]/g, (literal, key) => {
    if (!notes.defs.has(key)) {
      // No matching definition - leave the raw `[^cle]` visible so the author
      // can see there is something to fix.
      notes.missing.push(key);
      return literal;
    }
    const seen = notes.numbers.has(key);
    if (!seen) {
      notes.numbers.set(key, notes.refOrder.length + 1);
      notes.refOrder.push(key);
    }
    const n = notes.numbers.get(key);
    const id = `${notes.slug}-${n}`;
    // Only the first reference carries the anchor the back-link returns to.
    const anchor = seen ? '' : ` id="fnref-${id}"`;
    return `<sup class="article-note-ref"${anchor}><a href="#fn-${id}">${n}</a></sup>`;
  });
}

function renderNotes(notes, lang) {
  const unreferenced = notes.defOrder.filter(k => !notes.numbers.has(k));
  if (notes.refOrder.length === 0 && unreferenced.length === 0) return '';
  const backLabel = lang === 'en' ? 'Back to text' : 'Retour au texte';
  const items = notes.refOrder.map((key, idx) => {
    const id = `${notes.slug}-${idx + 1}`;
    return `<li id="fn-${id}">${inlineMarkdown(notes.defs.get(key))}` +
      ` <a class="article-note-back" href="#fnref-${id}" aria-label="${backLabel}" title="${backLabel}">&#8617;</a></li>`;
  });
  // A note nothing points to is still content the author wrote - keep it,
  // minus the back-link, rather than dropping it silently.
  unreferenced.forEach(key => items.push(`<li>${inlineMarkdown(notes.defs.get(key))}</li>`));
  return `<section class="article-notes">
  <h2 class="article-notes-title">Notes</h2>
  <ol class="article-notes-list">
    ${items.join('\n    ')}
  </ol>
</section>`;
}

function markdownToHtml(md, slug, lang) {
  const extracted = extractFootnoteDefs(md.split('\n'));
  const notes = {
    slug,
    defs: extracted.defs,
    defOrder: extracted.defOrder,
    numbers: new Map(),
    refOrder: [],
    missing: []
  };
  const lines = extracted.lines;
  const result = [];
  let inList = false;
  let inBlockquote = false;
  let blockquoteLines = [];
  let i = 0;

  function flushBlockquote() {
    if (inBlockquote && blockquoteLines.length > 0) {
      const inner = blockquoteLines.join(' ').trim();
      result.push(`<blockquote>\n<p>${inlineMarkdown(inner, notes)}</p>\n</blockquote>`);
      blockquoteLines = [];
      inBlockquote = false;
    }
  }

  let listType = null; // 'ul' or 'ol'
  function flushList() {
    if (inList) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      // Flush blockquote on empty line after blockquote
      if (inBlockquote) {
        flushBlockquote();
      }
      if (inList) {
        flushList();
      }
      i++;
      continue;
    }

    // Heading ## -> h2
    const headingMatch = trimmed.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushBlockquote();
      flushList();
      result.push(`<h2>${inlineMarkdown(headingMatch[1], notes)}</h2>`);
      i++;
      continue;
    }

    // Blockquote > text
    if (trimmed.startsWith('> ')) {
      flushList();
      inBlockquote = true;
      blockquoteLines.push(trimmed.substring(2));
      i++;
      continue;
    }

    // List item: -, *, + (unordered) or 1. (ordered)
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ulMatch || olMatch) {
      flushBlockquote();
      const wantedType = ulMatch ? 'ul' : 'ol';
      if (inList && listType !== wantedType) flushList();
      if (!inList) {
        result.push(`<${wantedType}>`);
        inList = true;
        listType = wantedType;
      }
      result.push(`<li>${inlineMarkdown((ulMatch || olMatch)[1], notes)}</li>`);
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    flushBlockquote();
    flushList();
    const paraLines = [];
    const isListLine = (s) => /^[-*+]\s+/.test(s) || /^\d+\.\s+/.test(s);
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (pLine === '' || pLine.startsWith('## ') || pLine.startsWith('> ') || isListLine(pLine)) {
        break;
      }
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      result.push(`<p>${inlineMarkdown(paraLines.join(' '), notes)}</p>`);
    }
    continue;
  }

  // Flush any remaining state
  flushBlockquote();
  flushList();

  if (notes.missing.length > 0) {
    console.warn(`  ! ${slug}: note(s) sans definition -> ${[...new Set(notes.missing)].map(k => `[^${k}]`).join(', ')}`);
  }

  return { body: result.join('\n'), notesHtml: renderNotes(notes, lang) };
}

// ── French date formatter ─────────────────────────────────────────────────
const FRENCH_MONTHS = [
  'janvier', 'f\u00e9vrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'ao\u00fbt', 'septembre', 'octobre', 'novembre', 'd\u00e9cembre'
];

function formatDateFr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = FRENCH_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// ── English date formatter ───────────────────────────────────────────────
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDateEn(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const month = ENGLISH_MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────
const svgLinkedin = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
const svgFacebook = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
const svgLink = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

// ── Read & parse articles (generic) ──────────────────────────────────────
function slugify(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readArticles(dir, lang) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = parseFrontmatter(raw);
      const rawSlug = data.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      const slug = slugify(rawSlug);
      const { body: bodyHtml, notesHtml } = markdownToHtml(content, slug, lang);
      return { ...data, slug, bodyHtml, notesHtml };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')); // newest first
}

const articles = readArticles(path.join(__dirname, 'content', 'articles'), 'fr');
const articlesEn = readArticles(path.join(__dirname, 'content', 'articles-en'), 'en');

// ── HTML generators ───────────────────────────────────────────────────────
function blogCard(a) {
  return `<div class="blog-card reveal" data-modal="article-${a.slug}">
  <div class="blog-card-image">
    <img src="${a.image}?auto=compress&cs=tinysrgb&w=600&h=340&fit=crop" alt="${escapeAttr(a.title)}">
  </div>
  <div class="blog-card-body">
    <div class="blog-card-category">${a.category}</div>
    <h3 class="blog-card-title">${a.title}</h3>
    <p class="blog-card-excerpt">${(a.excerpt || '').replace(/\n/g, '<br>')}</p>
    <div class="blog-card-meta"><span>${a.readTime}</span></div>
  </div>
</div>`;
}

function articlePanel(a, lang) {
  const closeLabel = lang === 'en' ? 'Close' : 'Fermer';
  const bylineCreds = lang === 'en' ? 'CRIA \u00b7 Founder of Aur\u00e9a RH Conseil' : 'CRIA \u00b7 Fondateur d\u2019Aur\u00e9a RH Conseil';
  const shareLabel = lang === 'en' ? 'Share' : 'Partager';
  const copyLabel = lang === 'en' ? 'Copy link' : 'Copier le lien';
  return `<div class="blog-article-panel" id="article-${a.slug}">
  <div class="article-hero">
    <img src="${a.image}?auto=compress&cs=tinysrgb&w=760&h=428&fit=crop" alt="${escapeAttr(a.title)}">
    <div class="article-hero-overlay">
      <span class="article-category-badge">${a.category}</span>
      <button class="blog-modal-close" aria-label="${closeLabel}">\u2715</button>
    </div>
  </div>
  <div class="article-content">
    <div class="article-meta">
      <span class="article-type">${a.series}</span>
      <span class="article-read-time">${a.readTime}</span>
    </div>
    <h1 class="article-title">${a.title}</h1>
    <div class="article-byline">
      <span class="byline-name">Hugues Thibault</span>
      <span class="byline-creds">${bylineCreds}</span>
    </div>
    <div class="article-body">${a.bodyHtml}</div>
${a.notesHtml}
    <div class="article-share">
      <span class="share-label">${shareLabel}</span>
      <div class="share-buttons">
        <a href="#" onclick="shareLinkedIn(event)" class="share-btn">${svgLinkedin} LinkedIn</a>
        <a href="#" onclick="shareFacebook(event)" class="share-btn">${svgFacebook} Facebook</a>
        <button class="share-btn" onclick="copyArticleLink(this)">${svgLink} ${copyLabel}</button>
      </div>
    </div>
  </div>
</div>`;
}

function listingCard(a, lang) {
  const formattedDate = lang === 'en' ? formatDateEn(a.date) : formatDateFr(a.date);
  return `<div class="listing-card" data-modal="article-${a.slug}">
  <div class="listing-card-img"><img src="${a.image}?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="${escapeAttr(a.title)}"></div>
  <div class="listing-card-body">
    <div class="listing-card-cat">${a.category}</div>
    <h4 class="listing-card-title">${a.title}</h4>
    <div class="listing-card-meta">${formattedDate} \u00b7 ${a.readTime}</div>
  </div>
</div>`;
}

// ── Build helper ─────────────────────────────────────────────────────────
function buildSite(templateFile, outputFile, siteArticles, lang) {
  const tpl = fs.readFileSync(path.join(__dirname, templateFile), 'utf8');

  const blogCardsHtml = siteArticles.slice(0, 3).map(a => blogCard(a)).join('\n\n');
  const articlePanelsHtml = siteArticles.map(a => articlePanel(a, lang)).join('\n\n');
  const listingCardsHtml = siteArticles.map(a => listingCard(a, lang)).join('\n\n');

  const result = tpl
    .replace('<!-- BLOG_CARDS -->', blogCardsHtml)
    .replace('<!-- ARTICLE_PANELS -->', articlePanelsHtml)
    .replace('<!-- LISTING_CARDS -->', listingCardsHtml);

  // Ensure output directory exists
  const outputDir = path.dirname(path.join(__dirname, outputFile));
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(__dirname, outputFile), result, 'utf8');
  console.log(`Built ${outputFile} with ${siteArticles.length} articles`);
}

// ── Build FR ─────────────────────────────────────────────────────────────
buildSite('template.html', 'index.html', articles, 'fr');

// ── Build EN ─────────────────────────────────────────────────────────────
buildSite('template-en.html', 'en/index.html', articlesEn, 'en');
