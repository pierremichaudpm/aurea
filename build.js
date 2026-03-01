const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// ── Marked config ──────────────────────────────────────────────────────────
marked.use({ breaks: true, gfm: true });

// ── Read template ──────────────────────────────────────────────────────────
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

// ── Read & parse articles ──────────────────────────────────────────────────
const articlesDir = path.join(__dirname, 'content', 'articles');
const articles = fs.readdirSync(articlesDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse() // newest first
  .map(file => {
    const raw = fs.readFileSync(path.join(articlesDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const html = marked(content);
    return { ...data, slug, html };
  });

// ── SVG icons ──────────────────────────────────────────────────────────────
const svgLinkedin = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
const svgFacebook = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
const svgLink = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

// ── HTML generators ────────────────────────────────────────────────────────
function shareButtons() {
  return `
    <div class="article-share">
      <span class="share-label">Partager</span>
      <div class="share-buttons">
        <a href="#" onclick="shareLinkedIn(event)" class="share-btn">${svgLinkedin} LinkedIn</a>
        <a href="#" onclick="shareFacebook(event)" class="share-btn">${svgFacebook} Facebook</a>
        <button class="share-btn" onclick="copyArticleLink(this)">${svgLink} Copier le lien</button>
      </div>
    </div>`;
}

function articleModal(a) {
  const img = `${a.image}?auto=compress&cs=tinysrgb&w=760&h=428&fit=crop`;
  return `
<div class="blog-article-panel" id="article-${a.slug}">
  <div class="article-hero">
    <img src="${img}" alt="${a.title}">
    <div class="article-hero-overlay">
      <span class="article-category-badge">${a.category}</span>
      <button class="blog-modal-close" aria-label="Fermer">✕</button>
    </div>
  </div>
  <div class="article-content">
    <div class="article-meta">
      <span class="article-type">${a.series || 'Article'}</span>
      <span class="article-read-time">${a.readTime}</span>
    </div>
    <h1 class="article-title">${a.title}</h1>
    <div class="article-byline">
      <span class="byline-name">Hugues Thibault</span>
      <span class="byline-creds">CRIA · Fondateur d'Auréa RH Conseil</span>
    </div>
    <div class="article-body">${a.html}</div>
    ${shareButtons()}
  </div>
</div>`;
}

function blogCard(a) {
  const img = `${a.image}?auto=compress&cs=tinysrgb&w=600&h=340&fit=crop`;
  return `
<div class="blog-card reveal" data-modal="article-${a.slug}">
  <div class="blog-card-image">
    <img src="${img}" alt="${a.title}">
  </div>
  <div class="blog-card-body">
    <div class="blog-card-category">${a.category}</div>
    <h3 class="blog-card-title">${a.title}</h3>
    <p class="blog-card-excerpt">${a.excerpt}</p>
    <div class="blog-card-meta"><span>${a.readTime}</span></div>
  </div>
</div>`;
}

function listingCard(a) {
  const img = `${a.image}?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop`;
  const date = new Date(a.date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
<div class="listing-card" data-modal="article-${a.slug}">
  <div class="listing-card-img"><img src="${img}" alt=""></div>
  <div class="listing-card-body">
    <div class="listing-card-cat">${a.category}</div>
    <h4 class="listing-card-title">${a.title}</h4>
    <div class="listing-card-meta">${date} · ${a.readTime}</div>
  </div>
</div>`;
}

// ── Inject & write ─────────────────────────────────────────────────────────
const output = template
  .replace('<!-- BLOG_CARDS -->', articles.slice(0, 3).map(blogCard).join('\n'))
  .replace('<!-- LISTING_CARDS -->', articles.map(listingCard).join('\n'))
  .replace('<!-- BLOG_ARTICLE_MODALS -->', articles.map(articleModal).join('\n'));

fs.writeFileSync(path.join(__dirname, 'index.html'), output, 'utf8');
console.log(`✓ Built index.html — ${articles.length} articles`);
