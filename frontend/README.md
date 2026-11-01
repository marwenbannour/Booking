# Booking — Frontend (React + Next.js)

Interface web de la plateforme **Booking + Rappels WhatsApp** : espace pro (tableau de bord, rendez-vous) et parcours public de réservation. Construite sur la **Charte UI Booking** (design system) et branchée sur l'API NestJS existante.

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- Styles pilotés par les **tokens** de la charte (`src/styles/tokens.css`) — thèmes clair/sombre.
- Client API typé portant le contrat du backend (`src/lib/api.ts`).

## Démarrer

```bash
cd frontend
cp .env.local.example .env.local   # ajuster NEXT_PUBLIC_API_URL si besoin
npm install
npm run dev                        # http://localhost:5173
```

Le backend doit tourner sur `http://localhost:3000` (préfixe `/api/v1`) et autoriser
`http://localhost:5173` dans `CORS_ORIGINS` (déjà le cas dans `backend/.env.example`).

## Routes

| Route | Rôle |
| --- | --- |
| `/login` | Connexion à l'espace pro (email ou téléphone + mot de passe). |
| `/register` | Inscription propriétaire et création atomique d'un établissement. |
| `/forgot-password` et `/reset-password` | Demande et confirmation de réinitialisation par lien e-mail. |
| `/accept-invitation` | Acceptation d'une invitation, avec ou sans compte existant. |
| `/verify-email` | Confirmation d'une nouvelle adresse e-mail. |
| `/account` | Modification des coordonnées, changement de mot de passe, fermeture du compte. |
| `/dashboard` | KPIs + prochains rendez-vous (données d'exemple si l'API est injoignable). |
| `/bookings` | Liste des rendez-vous + actions (confirmer / annuler). |
| `/book/<slug>` | Parcours public de réservation en 4 étapes (service → créneau → coordonnées → confirmation). |

## Structure

```
src/
  app/              Routes (App Router)
    (app)/          Zone authentifiée (garde de session)
    book/[slug]/    Réservation publique
  components/
    ui/             Button, StatusBadge, MetricCard, Field (= composants de la charte)
    shell/          AppShell (sidebar + topbar), ThemeToggle
  lib/              api.ts (client HTTP), auth.tsx (contexte session), format.ts
  styles/tokens.css Tokens de la Charte UI Booking
```

## Notes

- **Sessions Web** : access token conservé en mémoire et refresh token dans un cookie
  `HttpOnly`/`SameSite`; aucun refresh token n'est accessible à JavaScript. Le client
  coalesce les refresh simultanés afin de ne faire qu'une rotation à la fois.
- **Thème** : bascule manuelle via `data-theme`, sinon `prefers-color-scheme`.
- Ce frontend remplace à terme le prototype vanilla (`../app.js`, `../index.html`).
