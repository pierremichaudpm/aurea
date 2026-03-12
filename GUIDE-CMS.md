# Auréa RH Conseil — Guide du CMS

Guide d'utilisation du système de gestion de contenu pour publier et gérer les articles du blogue.

---

## Accès au CMS

### URL d'administration
```
https://aurearhconseil.ca/admin/
```

### Première connexion
1. Vous recevrez un courriel d'invitation « Complete your signup »
2. Cliquez sur le lien pour définir votre mot de passe
3. Connectez-vous avec votre courriel et mot de passe

### Connexions suivantes
1. Rendez-vous à l'adresse `/admin/`
2. Cliquez « Login with Netlify Identity »
3. Entrez vos identifiants

---

## Créer un article

### Étape 1 — Ouvrir l'éditeur
1. Dans le panneau d'administration, cliquez sur **Articles** dans la barre latérale
2. Cliquez le bouton **Nouvel Article** en haut à droite

### Étape 2 — Remplir les champs

#### Titre
Le titre complet de l'article tel qu'affiché sur le site.
> Exemple : « La littératie émotionnelle : la compétence clé des leaders »

#### Identifiant URL (slug)
L'identifiant qui apparaîtra dans l'URL de l'article. Utilisez uniquement des **lettres minuscules**, des **chiffres** et des **tirets**. Pas d'accents, pas d'espaces.
> Exemple : `litteratie-emotionnelle`
> Donnera : `aurearhconseil.ca/#article-litteratie-emotionnelle`

#### Date de publication
Sélectionnez la date au format **JJ/MM/AAAA**. Les articles sont triés du plus récent au plus ancien.

#### Catégorie
Choisissez parmi les catégories disponibles :

| Catégorie                   | Usage                                  |
|-----------------------------|----------------------------------------|
| Leadership · Prévention     | Articles sur le leadership préventif   |
| Médiation · Émotions        | Gestion des émotions et médiation      |
| Gestion · Climat de travail | Gestion et environnement de travail    |
| Climat · Prévention         | Sécurité psychologique et prévention   |
| Prévention · RH             | Politiques RH et prévention            |
| Enquête · Rigueur           | Processus d'enquête                    |
| Formation · Leadership      | Formation et développement             |
| Médiation                   | Médiation pure                         |
| Prévention                  | Prévention pure                        |

#### Extrait
Un résumé de **2 à 3 phrases** qui apparaît sur la carte de l'article dans la section blogue. Soyez concis et accrocheur.
> Exemple : « Les émotions ne sont pas un obstacle à la gestion — elles en sont le fondement. Découvrez pourquoi la littératie émotionnelle est devenue incontournable pour les leaders RH. »

#### Image principale
Téléversez une photo **horizontale** d'au minimum **1200 × 675 pixels**. L'image sera recadrée automatiquement au format 16:9.

Conseils :
- Privilégiez des images professionnelles de haute qualité
- Évitez les images avec trop de texte
- Les tons sobres (bleu, gris, beige) s'harmonisent mieux avec le site

#### Série / Type
Indiquez le type de publication :
- **Article** — Publication unique (valeur par défaut)
- **Série · X volets** — Article faisant partie d'une série
- **Dossier** — Analyse approfondie

#### Temps de lecture
Estimez le temps de lecture. Format : `X min de lecture`
> Exemple : `5 min de lecture`

### Étape 3 — Rédiger le contenu

L'éditeur utilise le format **Markdown**. Voici les éléments disponibles :

#### Sous-titres
```
## Mon sous-titre
```
Utilisez `##` pour structurer votre article en sections.

#### Texte en gras
```
**texte important**
```

#### Citations
```
> Ceci est une citation mise en évidence.
```
Les citations apparaissent avec une barre dorée sur le côté gauche.

#### Listes à puces
```
- Premier élément
- Deuxième élément
- Troisième élément
```

#### Paragraphes
Séparez vos paragraphes par une ligne vide.

### Étape 4 — Publier
1. Vérifiez l'aperçu de votre contenu
2. Cliquez **Publier** en haut à droite
3. Confirmez la publication
4. L'article sera en ligne sous **~30 secondes** (temps du déploiement automatique)

---

## Modifier un article existant

1. Cliquez sur **Articles** dans la barre latérale
2. Cliquez sur l'article à modifier
3. Apportez vos modifications
4. Cliquez **Publier** pour sauvegarder

---

## Supprimer un article

1. Ouvrez l'article dans l'éditeur
2. Cliquez sur **Supprimer** (en bas ou dans le menu)
3. Confirmez la suppression
4. L'article disparaîtra du site après le déploiement (~30 secondes)

---

## Gestion des images

### Téléverser une image
- Cliquez sur le champ **Image principale** dans l'éditeur d'article
- Sélectionnez un fichier depuis votre ordinateur
- L'image sera uploadée dans le dossier `uploads/` du site

### Recommandations pour les images
- **Format :** JPEG ou PNG
- **Dimensions minimum :** 1200 × 675 pixels
- **Orientation :** Horizontale (paysage)
- **Taille fichier :** Moins de 2 Mo idéalement
- **Contenu :** Images professionnelles, bureaux, interactions d'équipe

---

## Fonctionnement des articles sur le site

### Affichage sur la page d'accueil
- Les **3 articles les plus récents** apparaissent dans la section Blogue
- Le premier article est mis en vedette (carte plus grande)
- Un bouton « Tous les articles » permet d'accéder à la liste complète

### Lecture d'un article
- Au clic sur une carte, l'article s'ouvre dans une modale
- L'article affiche : image, catégorie, titre, auteur, date, temps de lecture, contenu
- Des boutons de partage (LinkedIn, Facebook, copier le lien) sont disponibles

### Liens partageables
Chaque article a un lien direct sous la forme :
```
https://aurearhconseil.ca/#article-identifiant-url
```
Ce lien ouvre directement l'article lorsque partagé.

---

## Résolution de problèmes

### « Git Gateway backend not returning valid settings »
- Vérifiez que **Identity** est activé dans Netlify (Site settings > Identity)
- Vérifiez que **Git Gateway** est activé (Identity > Services > Git Gateway)

### L'article ne s'affiche pas après publication
- Le déploiement prend environ 30 secondes
- Rafraîchissez la page avec Ctrl+Maj+R (ou Cmd+Maj+R sur Mac)
- Vérifiez dans Netlify > Deploys que le dernier build a réussi

### Image non affichée
- Vérifiez que l'image est bien au format JPEG ou PNG
- Vérifiez que l'URL de l'image est correcte dans le champ
- Les images externes (URLs) doivent être accessibles publiquement

### Mot de passe oublié
- Sur la page de connexion, cliquez « Forgot password »
- Un courriel de réinitialisation sera envoyé

---

## Bonnes pratiques

1. **Slug cohérent** — Utilisez des mots-clés pertinents, courts et sans accents
2. **Images de qualité** — Une bonne image augmente l'engagement
3. **Extraits accrocheurs** — C'est la première chose que les visiteurs lisent
4. **Structure claire** — Utilisez des sous-titres `##` pour aérer le contenu
5. **Relecture** — Vérifiez l'orthographe avant de publier
6. **Catégorisation** — Choisissez la catégorie la plus pertinente pour faciliter la navigation
