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
│   ├── index.html         # Interface Decap CMS
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
- **CMS** : Decap CMS (anciennement Netlify CMS) via `/admin/`
- **Hébergement** : Netlify (slug: `aureav2`, nouveau compte — ancien compte supprimé 2026-05-21, ancien slug `aurearh` / site ID `54963284-767c-41a6-9cce-1714f9443e19` invalides)
- **URL temporaire** : `aureav2.netlify.app` (domaine custom bloqué en attente de libération par le support Netlify)
- **Domaine** : aurearhconseil.ca (enregistré chez WordPress.com — en attente d'assignation au nouveau site `aureav2`)
- **Formulaires** : Netlify Forms activé, notifications email configurées → hugues.thibault@aurearhconseil.ca (formulaires `contact` + `contact-en`)
- **Auth** : Netlify Identity activé (Invite only) + Git Gateway activé → repo `pierremichaudpm/aurea`
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
- Formulaire contact EN nommé `contact-en` (soumissions séparées dans Netlify)
- **Images** : chemins absolus obligatoires dans `template-en.html` (sinon résolus vers `/en/image.jpg`)
- **Articles de blogue EN** : 6 articles traduits dans `content/articles-en/` (miroir de `content/articles/`)

### Bio fondateur
- Modale « Qui suis-je » / « About me » avec sections : Parcours, Approche, Engagement, Accréditations
- Déclenchée par un `<button>` sous la photo (pas `<a href="#">` qui cause un scroll-to-top)
- Section « Accréditations » (FR) / « Credentials » (EN) — sans mention « Bilingue »

### Build et déploiement
- Netlify build command : `node build.js`
- Publish directory : `.` (racine)
- Le push sur main déclenche un deploy automatique (~30 sec)
- Si le deploy auto ne se déclenche pas, utiliser le MCP Netlify `deploy-site` avec site ID ou `npx @netlify/mcp`

### Voix et ton
- Le site utilise la 1re personne du singulier (je/ma/mes) — **pas** nous/notre/nos
- Ponctuation : points dans les phrases complètes, **pas** dans les titres/sous-titres/teasers
- Pas de tirets cadratins (—) dans le contenu visible, utiliser des virgules ou points-virgules

### Images hero
- Image hero actuelle : `trois.jpg` (383 KB)
- Le cadre hero utilise un masque CSS avec fondu progressif (`mask-image` gradient 12%→88%)
- `inset: -32px` sur `.hero-right-bg` pour élargir la zone visible

### Formulaire contact
- JS AJAX submit avec `fetch()` + message de succès in-page (FR: « Merci pour votre message... », EN: « Thank you for your message... »)
- Le `<div id="formSuccess">` est **en dehors** du `<form>` — sinon `form.style.display = 'none'` cache aussi la confirmation
- Le formulaire disparaît après soumission, remplacé par le message de confirmation
- **Attention** : ne pas utiliser d'apostrophe ASCII (`'`) dans les strings JS délimitées par `'` — utiliser `"` comme délimiteur si le texte contient des apostrophes françaises
- EN form : `fetch('/en/')` (pas `/`) car servi depuis `/en/index.html`
- Notifications email : hooks Netlify `submission_created` → `hugues.thibault@aurearhconseil.ca` (un hook par formulaire, avec `form_id` spécifique)

### Contenu client
- Le copydeck est fourni en `.docx` avec conventions de balisage :
  - **rev.1** : rouge = nouveau/modifié, barré = supprimé, noir = inchangé → parser `font.color.rgb` et `font.strike`
  - **rev.2** : jaune surligné = nouveau/modifié → parser `w:highlight` avec valeur `yellow`
- Copydeck EN rev.1 (`aurea-copydeck-EN_v2 rev1.HT.docx`) : même convention rouge/barré que rev.1 FR
- Les articles de blogue sont gérés via le CMS, pas dans le copydeck

### CMS — quirks publication via Decap
- **Parser `parseFrontmatter` dans `build.js` est maison** (pas gray-matter). Il gère désormais : valeurs sur une ligne, block scalars YAML (`>`, `>-`, `|`, `|-`), strings double-quoted multi-lignes (CMS wrap les longs titres). Cas restants probablement non couverts : single-quoted multi-line, escape sequences `\"`, formats YAML exotiques.
- **Parser `markdownToHtml` dans `build.js` est maison aussi**. Listes : reconnaît `-`, `*`, `+` (puces) et `1.` (numérotées). Blockquote `>`, headings `##`, gras `**`. Cas non couverts : code blocks ` ``` `, listes imbriquées, images `![]()`, liens `[]()`.
- **Avant de blâmer Decap pour un bug d'affichage**, ouvrir l'article `.md` dans `content/articles/` et comparer YAML/markdown brut au HTML généré.
- **Branding admin custom** dans `admin/index.html` (logo Auréa) → cassait le sticky de la nav Decap après login. Solution : JS écoute `netlifyIdentity.on('init'/'login'/'logout')` et hide la div `.cms-branding` quand connecté.

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
