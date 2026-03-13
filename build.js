const fs = require('fs');
const path = require('path');

// ── Frontmatter parser (no external deps) ─────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) data[m[1]] = m[2];
  }
  return { data, content: match[2] };
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

function inlineMarkdown(text) {
  // Bold: **text** -> <strong>text</strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Escape quotes and apostrophes as HTML entities
  text = text.replace(/\u2019/g, '&#39;');  // right single quotation mark
  text = text.replace(/\u2018/g, '&#39;');  // left single quotation mark
  text = text.replace(/\u201C/g, '&quot;'); // left double quotation mark
  text = text.replace(/\u201D/g, '&quot;'); // right double quotation mark
  text = text.replace(/'/g, '&#39;');
  text = text.replace(/\u00AB/g, '&laquo;'); // «
  text = text.replace(/\u00BB/g, '&raquo;'); // »
  return text;
}

function markdownToHtml(md) {
  const lines = md.split('\n');
  const result = [];
  let inList = false;
  let inBlockquote = false;
  let blockquoteLines = [];
  let i = 0;

  function flushBlockquote() {
    if (inBlockquote && blockquoteLines.length > 0) {
      const inner = blockquoteLines.join(' ').trim();
      result.push(`<blockquote>\n<p>${inlineMarkdown(inner)}</p>\n</blockquote>`);
      blockquoteLines = [];
      inBlockquote = false;
    }
  }

  function flushList() {
    if (inList) {
      result.push('</ul>');
      inList = false;
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
      result.push(`<h2>${inlineMarkdown(headingMatch[1])}</h2>`);
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

    // List item - text
    const listMatch = trimmed.match(/^- (.+)$/);
    if (listMatch) {
      flushBlockquote();
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${inlineMarkdown(listMatch[1])}</li>`);
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    flushBlockquote();
    flushList();
    const paraLines = [];
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (pLine === '' || pLine.startsWith('## ') || pLine.startsWith('> ') || pLine.startsWith('- ')) {
        break;
      }
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      result.push(`<p>${inlineMarkdown(paraLines.join(' '))}</p>`);
    }
    continue;
  }

  // Flush any remaining state
  flushBlockquote();
  flushList();

  return result.join('\n');
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
function readArticles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = parseFrontmatter(raw);
      const slug = data.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      const bodyHtml = markdownToHtml(content);
      return { ...data, slug, bodyHtml };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')); // newest first
}

const articles = readArticles(path.join(__dirname, 'content', 'articles'));
const articlesEn = readArticles(path.join(__dirname, 'content', 'articles-en'));

// ── HTML generators ───────────────────────────────────────────────────────
function blogCard(a) {
  return `<div class="blog-card reveal" data-modal="article-${a.slug}">
  <div class="blog-card-image">
    <img src="${a.image}?auto=compress&cs=tinysrgb&w=600&h=340&fit=crop" alt="${escapeAttr(a.title)}">
  </div>
  <div class="blog-card-body">
    <div class="blog-card-category">${a.category}</div>
    <h3 class="blog-card-title">${a.title}</h3>
    <p class="blog-card-excerpt">${a.excerpt}</p>
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
