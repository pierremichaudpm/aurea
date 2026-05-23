# CLAUDE.md — Auréa RH Conseil (site web)

## Structure du projet

```
~/Documents/aurea/build/
├── template.html          # Source HTML FR (ÉDITER CELUI-CI pour le contenu français)
├── template-en.html       # Source HTML EN (ÉDITER CELUI-CI pour le contenu anglais)
├── index.html             # GÉNÉRÉ (FR) — ne PAS éditer (gitignored)
├── en/
│   └── index.html         # GÉNÉRÉ (EN) — ne PAS éditer (gitignored)
├── build.js               # Génère index.html + en/index.html depuis les templates + articles
├── content/
│   ├── articles/*.md      # Articles de blogue FR (frontmatter YAML + markdown)
│   ├── articles-en/*.md   # Articles de blogue EN (même format)
│   ├── aurea-copydeck-EN.md           # Copydeck anglais pour validation client
│   ├── aurea-copydeck-EN.docx         # Version docx du copydeck EN (pour envoi client)
│   ├── aurea-copydeck rev.1-HT.docx  # Copydeck client FR rev.1 (référence)
│   └── aurea-copydeck rev.2-HT.docx  # Copydeck client FR rev.2 (surlignage jaune = changements)
├── admin/
│   ├── index.html         # Interface Sveltia CMS
│   └── config.yml         # Config CMS (2 collections : articles FR + articles-en)
├── GUIDE-CMS.md           # Guide d'utilisation CMS pour le client (markdown source)
├── guide-pdf-source.html  # Source HTML stylé Studio Micho pour générer le PDF du guide
├── content/Guide-CMS-Aurea.pdf  # Livrable client, généré via weasyprint
├── WORKING_LOG.md         # Journal de session
└── .gitignore             # index.html et en/index.html sont ignorés (générés)
```

## Stack

- **HTML/CSS/JS** : Single-page statique, pas de framework
- **Build** : `node build.js` — génère `index.html` (FR) et `en/index.html` (EN) depuis les templates + articles markdown
- **CMS** : Sveltia CMS via `/admin/` — auth par GitHub Personal Access Token (PAT, scope `repo`)
- **Hébergement** : Cloudflare Pages (migration depuis Netlify 2026-05-23) — repo GitHub `pierremichaudpm/aurea`, build command `node build.js`, output dir `.`
- **URL temporaire** : `aurea-61m.pages.dev` (domaine custom en attente de configuration dans Cloudflare)
- **Domaine** : aurearhconseil.ca (enregistré chez WordPress.com — DNS à rediriger vers Cloudflare Pages après validation visuelle sur `.pages.dev`)
- **Formulaires** : Formspree — FR : `xlgvlbbz`, EN : `xgoqzkyw` → notifications → hugues.thibault@aurearhconseil.ca
- **Auth CMS** : Sveltia CMS + backend `github` (repo `pierremichaudpm/aurea`, branche `main`) — Hugues se connecte avec un PAT GitHub
- **Repo** : github.com/pierremichaudpm/aurea (branche main)
- **Email client** : Titan (via WordPress.com), MX records dans WordPress DNS

## Contraintes critiques

### Templates vs fichiers générés
- **TOUJOURS éditer `template.html` (FR) ou `template-en.html` (EN)**, jamais les `index.html`
- `index.html` et `en/index.html` sont dans `.gitignore` — régénérés par `node build.js`
- Le build remplace 3 placeholders dans chaque template : `<!-- BLOG_CARDS -->`, `<!-- ARTICLE_PANELS -->`, `<!-- LISTING_CARDS -->`
- Après toute édition : `node build.js && git add template.html template-en.html`

### Site bilingue
- **FR** : `aurearhconseil.ca/` — `template.html` → `index.html`, articles dans `content/articles/`
- **EN** : `aurearhconseil.ca/en/` — `template-en.html` → `en/index.html`, articles dans `content/articles-en/`
- Les deux templates sont autonomes (pas de système i18n partagé) — modifier l'un n'affecte pas l'autre
- hreflang tags présents dans les deux templates pour le SEO
- Language switcher (FR ↔ EN) dans la nav des deux templates
- Formulaire contact EN nommé `contact-en` (endpoint Formspree séparé)
- **Images** : chemins absolus obligatoires dans `template-en.html` (sinon résolus vers `/en/image.jpg`)
- **Articles de blogue EN** : 6 articles traduits dans `content/articles-en/` (miroir de `content/articles/`)

### Bio fondateur
- Modale « Qui suis-je » / « About me » avec sections : Parcours, Approche, Engagement, Accréditations
- Déclenchée par un `<button>` sous la photo (pas `<a href="#">` qui cause un scroll-to-top)
- Section « Accréditations » (FR) / « Credentials » (EN) — sans mention « Bilingue »

### Build et déploiement
- Cloudflare Pages build command : `node build.js`
- Publish directory : `.` (racine) — sources et output mélangés, pas de dossier `dist/`
- Le push sur main déclenche un deploy automatique (~1-2 min)
- NODE_VERSION = 20 configuré en variable d'environnement Cloudflare

### Voix et ton
- Le site utilise la 1re personne du singulier (je/ma/mes) — **pas** nous/notre/nos
- Ponctuation : points dans les phrases complètes, **pas** dans les titres/sous-titres/teasers
- Pas de tirets cadratins (—) dans le contenu visible, utiliser des virgules ou points-virgules

### Images hero
- Image hero actuelle : `trois.jpg` (383 KB)
- Le cadre hero utilise un masque CSS avec fondu progressif (`mask-image` gradient 12%→88%)
- `inset: -32px` sur `.hero-right-bg` pour élargir la zone visible

### Formulaire contact
- JS AJAX submit avec `fetch()` vers Formspree + `Accept: application/json` + `new FormData(form)` (pas URLSearchParams)
- Test `response.ok` dans le `.then()` — throw si 4xx/5xx, catch gère les erreurs réseau et HTTP
- Le `<div id="formSuccess">` est **en dehors** du `<form>` — sinon `form.style.display = 'none'` cache aussi la confirmation
- Le formulaire disparaît après soumission, remplacé par le message de confirmation
- **Attention** : ne pas utiliser d'apostrophe ASCII (`'`) dans les strings JS délimitées par `'` — utiliser `"` comme délimiteur si le texte contient des apostrophes françaises
- FR : `fetch('https://formspree.io/f/xlgvlbbz', ...)` / EN : `fetch('https://formspree.io/f/xgoqzkyw', ...)`
- Notifications email : configurées dans le dashboard Formspree → `hugues.thibault@aurearhconseil.ca`

### Contenu client
- Le copydeck est fourni en `.docx` avec conventions de balisage :
  - **rev.1** : rouge = nouveau/modifié, barré = supprimé, noir = inchangé → parser `font.color.rgb` et `font.strike`
  - **rev.2** : jaune surligné = nouveau/modifié → parser `w:highlight` avec valeur `yellow`
- Copydeck EN rev.1 (`aurea-copydeck-EN_v2 rev1.HT.docx`) : même convention rouge/barré que rev.1 FR
- Les articles de blogue sont gérés via le CMS, pas dans le copydeck

### CMS — Sveltia CMS (depuis 2026-05-23)
- **Backend** : `github` (repo `pierremichaudpm/aurea`, branche `main`) — plus de Netlify Identity ni Git Gateway
- **Auth** : Personal Access Token GitHub (scope `repo`). Hugues se connecte via « Sign in with Token » sur `/admin/`. Le token est mémorisé dans le navigateur.
- **Si token expiré** : générer un nouveau PAT sur GitHub → Settings → Developer settings → Personal access tokens (scope `repo`)
- **Accès collaborateur** : le compte GitHub de Hugues doit avoir accès en écriture au repo `pierremichaudpm/aurea`

### CMS — quirks publication via Sveltia
- **Parser `parseFrontmatter` dans `build.js` est maison** (pas gray-matter). Il gère désormais : valeurs sur une ligne, block scalars YAML (`>`, `>-`, `|`, `|-`), strings double-quoted multi-lignes (CMS wrap les longs titres). Cas restants probablement non couverts : single-quoted multi-line, escape sequences `\"`, formats YAML exotiques.
- **Parser `markdownToHtml` dans `build.js` est maison aussi**. Listes : reconnaît `-`, `*`, `+` (puces) et `1.` (numérotées). Blockquote `>`, headings `##`, gras `**`. Cas non couverts : code blocks ` ``` `, listes imbriquées, images `![]()`, liens `[]()`.
- **Avant de blâmer Sveltia pour un bug d'affichage**, ouvrir l'article `.md` dans `content/articles/` et comparer YAML/markdown brut au HTML généré.
- **Branding admin custom** dans `admin/index.html` (logo Auréa, gold) — conservé tel quel, Sveltia l'affiche sur l'écran de login. Le bloc JS `netlifyIdentity` a été retiré (inutile avec Sveltia).

### Guide CMS — PDF pour le client
- **Source markdown** : `GUIDE-CMS.md` (référence dev, à jour)
- **Source PDF** : `guide-pdf-source.html` (HTML autonome, logo Studio Micho en base64, styling DM Sans)
- **Régénération** : `weasyprint guide-pdf-source.html content/Guide-CMS-Aurea.pdf`
- **Contenu PDF doit être maintenu en parallèle** du markdown. Pas d'auto-conversion (la mise en page PDF a des choix éditoriaux).

### Domaine et DNS
- Domaine enregistré chez WordPress.com (aurearhconseil.ca, expire 2027-01-09)
- Nameservers : WordPress.com (ns1/ns2/ns3.wordpress.com)
- A record `@` → `75.2.60.5` (Netlify)
- CNAME `www` → `aurearh.netlify.app`
- MX records → Titan email (mx1/mx2.titan.email) — ne pas toucher
- TXT records : SPF, DKIM, DMARC pour Titan — ne pas toucher

## Services actuels (6)

1. Enquête en harcèlement et incivilité
2. Médiation et résolution des différends
3. Analyse de climat
4. Prévention du harcèlement et des risques psychosociaux
5. Relations de travail et gestion des situations sensibles
6. Conseil stratégique en enjeux humains

## Valeurs actuelles

Écoute · Impartialité · Rigueur · Intégrité

## Client

- Hugues Thibault, CRIA · Médiateur accrédité · Fondateur
- hugues.thibault@aurearhconseil.ca
- Netlify Identity configuré (invité 2026-03-06)

## Contexte global
Voir ~/Documents/CONTEXT.md pour le profil complet,
les conventions transversales et la liste des clients actifs.
