# Maquettes — Booking+ (Dev-booking-version3)

Maquettes haute-fidélité et prototypes **cliquables** de la plateforme de réservation **Booking+**,
à valider avant le développement.

## Direction artistique

| Élément | Valeur |
|---|---|
| Bleu nuit | `#0A1B2E` |
| Bleu foncé | `#102A43` |
| Turquoise (accent) | `#14B8A6` |
| Vert succès | `#22C55E` |
| Gris clair | `#F1F5F9` |
| Typographie | **Sora** + **Noto Sans Arabic** (RTL) |
| Icônes | **Lucide** (line, 2px) |
| Style | SaaS Premium, moderne, minimaliste |
| Langues | Français + Arabe (RTL) — bascule intégrée |
| Thème | Clair / Sombre — bascule intégrée |

## Écrans

### ✅ 01 — Site web public (`01-site-public.html`)
Prototype 8 écrans avec navigation : Accueil, Fonctionnalités, Tarifs, Contact/FAQ,
Connexion, Inscription, **Réservation publique** (parcours 4 étapes Service → Employé →
Date/heure → Infos), Confirmation.

### ✅ 02 — Dashboard SaaS (`02-dashboard.html`)
Application 11 modules avec sidebar : Tableau de bord (KPI + graphiques),
Calendrier (jour/semaine/mois), Rendez-vous (liste + détail + création),
Clients, Services, Employés, Disponibilités, WhatsApp (modèles + historique),
Abonnement (quotas + facturation), Paramètres (onglets), Administration (multi-tenant).

### ✅ 03 — Application mobile (`03-mobile.html`)
Cadre téléphone interactif avec bascule **Espace Client / Espace Pro** et barre
d'onglets par espace.
- **Client** : Accueil, Recherche, Services d'un établissement, Réservation
  (employé → date → heure), Confirmation, Mes RDV, Notifications, Profil.
- **Pro** : Dashboard (KPI + mini-graphes), Agenda (timeline), Clients,
  Notifications, Profil/paramètres.

### 🧭 Page d'accueil (`index.html`)
Hub qui relie les 3 prototypes — point d'entrée à ouvrir en premier.

## Utilisation
Chaque fichier est autonome (HTML/CSS/JS, dépendances via CDN). Ouvrir directement
dans un navigateur. Boutons de bascule 🌙 thème et AR/FR en haut de chaque maquette.

## Ordre de réalisation
1. ✅ Site public
2. ✅ Dashboard SaaS
3. ✅ Application mobile
4. ✅ Prototype interactif (navigation dans chaque maquette + hub `index.html`)
5. ⏳ Validation des parcours
6. ⏳ Développement
