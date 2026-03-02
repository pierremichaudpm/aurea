# Auréa RH Conseil — Documentation technique

## Vue d'ensemble

Site vitrine statique pour Auréa RH Conseil, cabinet québécois spécialisé en médiation, enquête en harcèlement et prévention en milieu de travail.

- **Hébergement :** Netlify
- **CMS :** Decap CMS (anciennement Netlify CMS)
- **Authentification :** Netlify Identity + Git Gateway
- **Dépôt :** github.com/pierremichaudpm/aurea (branche `main`)
- **Langue :** Français

---

## Architecture des fichiers

```
aurea/build/
├── template.html          # Gabarit maître (HTML + CSS + JS inline)
├── index.html             # Page générée par build.js (gitignored)
├── build.js               # Script de construction Node.js
├── package.json            # Dépendances Node
├── netlify.toml            # Configuration Netlify (build + headers)
├── .gitignore
│
├── admin/
│   ├── index.html          # Page d'administration Decap CMS
│   └── config.yml          # Configuration des collections CMS
│
├── content/
│   └── articles/           # Articles en Markdown (frontmatter YAML)
│       ├── 2024-01-15-litteratie-emotionnelle.md
│       ├── 2024-01-22-rationalite-et-emotions.md
│       ├── 2024-02-01-gestion-arbitraire.md
│       ├── 2024-02-15-securite-psychologique.md
│       ├── 2024-03-01-politiques-harcelement.md
│       └── 2024-03-15-impartialite-enquete.md
│
├── uploads/                # Médias uploadés via le CMS
│
├── signatures/             # Logos exportés (SVG + PNG)
│   └── aurea-logos.zip
│
├── Hugues_photo.jpeg       # Photo du fondateur
├── hero-bg.jpg             # Image de fond héros
├── vitaly-gariev-ek9VJwUNNA4-unsplash.jpg  # Image héros (bureau)
│
├── aurea-copydeck.docx     # Copie deck pour validation client
├── email-signatures.html   # Signatures courriel
└── generate-signatures.js  # Générateur de logos PNG
```

---

## Pipeline de construction

### Déclenchement
Chaque `git push` sur `main` déclenche un build Netlify :

```
git push → Netlify détecte → node build.js → déploiement
```

### Fonctionnement de build.js

1. Lit tous les fichiers `.md` dans `content/articles/`
2. Parse le frontmatter YAML et convertit le Markdown en HTML
3. Génère 3 types de blocs HTML par article :
   - **Blog cards** (3 premiers articles, section blogue)
   - **Article panels** (modales de lecture complète)
   - **Listing cards** (panneau « tous les articles »)
4. Remplace les marqueurs dans `template.html` :
   - `<!-- BLOG_CARDS -->`
   - `<!-- ARTICLE_PANELS -->`
   - `<!-- LISTING_CARDS -->`
5. Écrit le résultat dans `index.html`

### Commande locale

```bash
node build.js
```

Aucune dépendance externe requise. Le parseur Markdown et le parseur frontmatter sont intégrés dans le script.

---

## Système de design

### Palette de couleurs

| Variable         | Valeur    | Usage                     |
|------------------|-----------|---------------------------|
| `--navy`         | `#1a2332` | Couleur principale foncée |
| `--navy-deep`    | `#0f1720` | Superpositions            |
| `--gold`         | `#c8a44e` | Accent de marque          |
| `--gold-light`   | `#c8a44e` | Or clair (unifié)         |
| `--gold-muted`   | `#c8a44e` | Or atténué (unifié)       |
| `--cream`        | `#faf8f4` | Fond clair                |
| `--cream-warm`   | `#f5f0e8` | Fond chaud                |
| `--stone`        | `#e8e2d8` | Gris beige                |
| `--text-dark`    | `#1a2332` | Texte principal           |
| `--text-body`    | `#3d4a5c` | Texte courant             |
| `--text-muted`   | `#6b7a8d` | Texte secondaire          |

### Typographie

| Variable   | Police             | Poids disponibles     |
|------------|--------------------|-----------------------|
| `--serif`  | Cormorant Garamond | 300, 400, 500, 600, 700 |
| `--sans`   | DM Sans            | 300, 400, 500         |

### Points de rupture responsive

| Largeur     | Comportement                                        |
|-------------|-----------------------------------------------------|
| > 1024px    | Layout complet, grilles multi-colonnes              |
| ≤ 1024px    | Grilles réduites, héros simplifié                   |
| ≤ 768px     | Navigation mobile, colonnes simples, modales plein écran |

---

## Sections de la page

1. **Navigation** (`#mainNav`) — Fixe, effet de scroll (fond + ombre)
2. **Héros** — Accroche, CTAs, statistiques, image de fond avec masque
3. **Philosophie** (`#philosophie`) — Fondateur, valeurs, citation
4. **Services** (`#services`) — 6 cartes avec modales détaillées (`#modal-01` à `#modal-06`)
5. **Approche** (`#approche`) — Grille 2×2 des étapes + logo Auréa
6. **Blogue** (`#blogue`) — 3 articles vedettes avec modales de lecture
7. **Bande CTA** — Invitation à contacter
8. **Contact** (`#contact`) — Formulaire + coordonnées
9. **Pied de page** — Liens, logo, réseaux sociaux

---

## JavaScript — Fonctionnalités

### Navigation
- **Effet scroll :** Classe `.scrolled` ajoutée au-delà de 60px de défilement
- **Menu mobile :** Classe `.open` sur `#mobileNav`
- **Défilement doux :** Tous les liens `#ancre` utilisent `scrollIntoView`

### Système de modales
- **`openModal(id)`** — Ouvre la modale correspondante, ferme les autres
- **`closeModal()`** — Ferme toutes les modales actives
- **Déclencheurs :** Attribut `data-modal="id"`, clic sur overlay, touche ESC

### Partage d'articles
- **LinkedIn / Facebook** — Fenêtre de partage avec l'URL incluant le hash
- **Copier le lien** — Clipboard API avec retour visuel « ✓ Lien copié »

### Liens profonds
- Si l'URL contient `#article-{slug}`, la modale correspondante s'ouvre au chargement

### Animations
- **Entrée héros :** Apparition séquentielle (délais de 0.2s à 1.15s)
- **Scroll reveal :** IntersectionObserver avec seuil 0.08, décalage de 110ms entre éléments

---

## Configuration Netlify

```toml
[build]
  command = "node build.js"
  publish = "."

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/admin/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
```

### Services Netlify requis
- **Identity** — Activé (gestion des utilisateurs CMS)
- **Git Gateway** — Activé (permet au CMS d'écrire dans le dépôt Git)

---

## Format des articles

### Frontmatter YAML

```yaml
---
title: "Titre de l'article"
slug: identifiant-url
date: 2024-01-15
category: "Leadership · Prévention"
excerpt: "Résumé de 2-3 phrases"
image: "https://url-vers-image.jpg"
series: "Article"
readTime: "5 min de lecture"
---
```

### Contenu Markdown supporté

```markdown
## Sous-titre
**Texte en gras**
> Citation en bloc
- Élément de liste
Paragraphe standard
```

### Catégories disponibles
- Leadership · Prévention
- Médiation · Émotions
- Gestion · Climat de travail
- Climat · Prévention
- Prévention · RH
- Enquête · Rigueur
- Formation · Leadership
- Médiation
- Prévention

---

## Logos et signatures

Le dossier `signatures/` contient 6 variantes du logo en SVG et PNG :

| Variante                      | Fond        |
|-------------------------------|-------------|
| Logo seul                     | Navy / Transparent |
| Logo + « Auréa RH Conseil »  | Navy / Transparent |
| Logo + texte + tagline        | Navy / Transparent |

Générer les PNG : `node generate-signatures.js` (requiert ImageMagick)

---

## Déploiement

### Push standard
```bash
git add template.html admin/config.yml content/articles/
git commit -m "Description des changements"
git push
```
Netlify build et déploie automatiquement (~30 secondes).

### Notes importantes
- `index.html` est gitignored — ne jamais le commiter
- Toujours modifier `template.html`, pas `index.html`
- Les articles sont ajoutés soit via le CMS, soit manuellement dans `content/articles/`
- Les images uploadées via le CMS vont dans `uploads/`
