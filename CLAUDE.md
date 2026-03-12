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
├── GUIDE-CMS.md           # Guide d'utilisation CMS pour le client
├── WORKING_LOG.md         # Journal de session
└── .gitignore             # index.html et en/index.html sont ignorés (générés)
```

## Stack

- **HTML/CSS/JS** : Single-page statique, pas de framework
- **Build** : `node build.js` — génère `index.html` (FR) et `en/index.html` (EN) depuis les templates + articles markdown
- **CMS** : Decap CMS (anciennement Netlify CMS) via `/admin/`
- **Hébergement** : Netlify (site ID: `54963284-767c-41a6-9cce-1714f9443e19`, slug: `aurearh`)
- **Domaine** : aurearhconseil.ca
- **Auth** : Netlify Identity + Git Gateway (pour le CMS)
- **Repo** : github.com/pierremichaudpm/aurea (branche main)

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

### Images hero
- Image hero actuelle : `trois.jpg` (383 KB)
- Le cadre hero utilise un masque CSS avec fondu progressif (`mask-image` gradient 12%→88%)
- `inset: -32px` sur `.hero-right-bg` pour élargir la zone visible

### Contenu client
- Le copydeck est fourni en `.docx` avec conventions de balisage :
  - **rev.1** : rouge = nouveau/modifié, barré = supprimé, noir = inchangé → parser `font.color.rgb` et `font.strike`
  - **rev.2** : jaune surligné = nouveau/modifié → parser `w:highlight` avec valeur `yellow`
- Les articles de blogue sont gérés via le CMS, pas dans le copydeck

## Services actuels (6)

1. Enquête en harcèlement et incivilité
2. Médiation et résolution des différends
3. Analyse de climat
4. Prévention du harcèlement et des risques psychosociaux
5. Relations de travail et gestion des situations sensibles
6. Conseil stratégique en enjeux humains

## Valeurs actuelles

Écoute · Neutralité · Rigueur · Intégrité

## Client

- Hugues Thibault, CRIA · Médiateur accrédité · Fondateur
- hugues.thibault@aurearhconseil.ca
- Netlify Identity configuré (invité 2026-03-06)
