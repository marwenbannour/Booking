# Booking API

Backend NestJS/TypeScript pour la plateforme de réservation.

## Stack

- NestJS REST API avec JWT/Passport et Swagger
- PostgreSQL + Prisma
- Redis + BullMQ
- Jest + Supertest
- Docker Compose pour les dépendances locales

## Démarrage local

Prérequis : Node.js LTS, npm et Docker Desktop avec Docker Compose.

```powershell
Copy-Item .env.example .env
docker compose up -d postgres redis
npm ci
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

L'API écoute par défaut sur `http://localhost:3000/api/v1`. La documentation Swagger est disponible à `http://localhost:3000/docs`.

## Prototype frontend

Avec Python 3 installé, démarrez un serveur statique depuis la racine du projet, dans un terminal séparé :

```powershell
python -m http.server 5500
```

Ouvrez `http://localhost:5500/?booking=1&slug=atelier-17` pour afficher le parcours public connecté. Remplacez `atelier-17` par le slug d'un établissement actif. L'API doit être démarrée et autoriser `http://localhost:5500` dans `CORS_ORIGINS` (déjà configuré dans `.env.example` et Docker Compose). Le prototype utilise `http://localhost:3000/api/v1` par défaut ; pour une autre URL, définissez `window.BOOKING_API_URL` dans `index.html` avant le chargement de `booking-api.js`.

L'espace professionnel connecté est disponible via `http://localhost:5500/?professional=1` ou le bouton « Se connecter ». Il utilise `POST /api/v1/auth/login`, affiche les rendez-vous de l'établissement actif et conserve les jetons dans `sessionStorage` jusqu'à la fermeture de l'onglet. La création de comptes reste disponible via l'API `POST /api/v1/auth/register`. Les vues **Rendez-vous** et **Vue d'ensemble** (tableau de bord) sont connectées au backend : le tableau de bord lit `GET /api/v1/dashboard/summary` et `GET /api/v1/reports/bookings?groupBy=day` (cartes d'indicateurs, graphe des 7 derniers jours, prestations les plus réservées). Les autres vues professionnelles (calendrier, clients, messages, statistiques détaillées, paramètres) restent en mode prototype pour le moment.

Pour démarrer l'ensemble via Compose :

```powershell
docker compose up --build
```

Les identifiants de la configuration Compose sont destinés au développement local uniquement. Remplacez les secrets et mots de passe avant tout déploiement.

## Vérification

```powershell
npm test
npm run test:e2e
npm run build
```

Le test e2e de santé est isolé ; les tests d'intégration qui utilisent PostgreSQL/Redis doivent utiliser des services de test dédiés, jamais une base contenant des données réelles.

## État d'implémentation

Le backend comprend le serveur REST, la validation globale des entrées, Swagger, l'authentification JWT, Prisma, l'endpoint de santé, la lecture publique du profil, des services et des spécialistes par prestation, ainsi qu'un premier parcours de réservation. Celui-ci utilise `GET /api/v1/public/establishments/:slug`, `GET .../:slug/services`, `GET .../:slug/employees?serviceId=...`, `GET .../:slug/availability?serviceId=...&date=YYYY-MM-DD` et `POST .../:slug/bookings` (avec une clé `Idempotency-Key`). L'authentification expose `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` et `GET /api/v1/auth/me`. L'inscription crée le compte professionnel et son premier établissement propriétaire. Les mots de passe sont hachés avec scrypt ; les refresh tokens aléatoires ne sont stockés qu'en SHA-256, tournent à chaque renouvellement et leur réutilisation révoque la famille de sessions.

Le calcul des disponibilités et la création publique revalident les créneaux dans le fuseau de l'établissement. Les clés d'idempotence sont verrouillées et écrites dans la même transaction que la réservation.

## Notifications et WhatsApp

Le pipeline de notifications est opérationnel de bout en bout. À la création d'une réservation (confirmée) et lors des transitions de statut, un ou plusieurs `NotificationJob` et leurs `OutboxEvent` sont écrits **dans la même transaction** que la réservation (outbox transactionnel) : une réservation validée possède toujours son état de notification durable. Sont planifiés une confirmation immédiate, un premier rappel 24 h avant et un second 2 h avant (délais configurables par établissement). Les rappels dont l'échéance est déjà passée ne sont pas planifiés. Une annulation, un rejet, une complétion ou un no-show annule les jobs encore en attente (`PENDING`/`PROCESSING`), et une annulation planifie en plus un message d'annulation. Tous les envois sont conditionnés au consentement du client (`consentToReminders`, stocké sur la réservation) et aux réglages de l'établissement.

Un relais d'outbox (`OutboxRelayService`) interroge périodiquement `outbox_events` avec `FOR UPDATE SKIP LOCKED` (plusieurs instances coopèrent sans doublon), publie chaque événement dans la file BullMQ `booking-notifications` avec un délai calculé depuis `scheduledAt`, puis marque l'événement publié dans la même transaction. L'identifiant de job BullMQ est stable (idempotent), de sorte qu'un rollback après publication ne crée pas de doublon. Le relais se désactive via `NOTIFICATIONS_DISPATCHER_ENABLED=false`.

Le worker BullMQ (`NotificationProcessor`) revalide la réservation à chaque tentative (statut, échéance, consentement, réglages), construit le message localisé (fr/ar), l'envoie via l'abstraction `WhatsAppProvider`, enregistre la réponse dans `NotificationLog` et met à jour le `NotificationJob`. Les erreurs temporaires sont réessayées par BullMQ (backoff exponentiel), les erreurs définitives sont marquées `FAILED` sans réessai. Aucun message n'est déclaré « livré » sur la seule base de la réponse d'envoi : seul un webhook de livraison authentifié fait passer un job à `DELIVERED`.

Le fournisseur se choisit avec `WHATSAPP_PROVIDER` : `mock` (journalise sans appel externe, pour le développement et les tests) ou `meta` (WhatsApp Business Platform / Cloud API). Le webhook `GET /api/v1/webhooks/whatsapp` répond au handshake de vérification Meta ; `POST /api/v1/webhooks/whatsapp` vérifie la signature `x-hub-signature-256` sur le corps brut avant d'appliquer les statuts de livraison. Les jobs et leur journal se consultent via `GET /api/v1/notifications?establishmentId=...`, `GET /api/v1/notifications/:id` (permission `notifications.read`) ; les délais et activations se règlent via `GET/PATCH /api/v1/notification-settings?establishmentId=...` (`notifications.write` pour l'écriture). Le relais et le worker s'exécutent dans le processus `api` ; ils passent à l'échelle horizontalement (BullMQ répartit les jobs, le relais est protégé par `SKIP LOCKED`). L'envoi par e-mail n'est pas encore implémenté.

## Abonnements et quotas

Trois plans de référence (`free`, `pro`, `business`) sont créés par la migration `subscriptions` avec leurs quotas (employés, réservations/mois, notifications/mois, établissements). Ils se consultent via `GET /api/v1/subscription-plans`. Un établissement souscrit avec `POST /api/v1/subscriptions?establishmentId=...` (corps `{ "planCode": "pro" }`) et change de plan avec `POST /api/v1/subscriptions/change-plan`. Le statut initial suit des règles explicites : plan gratuit → `ACTIVE`, plan payant avec essai → `TRIALING` (avec `trialEndsAt`), plan payant sans essai → `PAST_DUE` jusqu'au paiement. `GET /api/v1/subscriptions/current?establishmentId=...` renvoie l'abonnement et la consommation de la période (employés, réservations, notifications avec leurs limites). La lecture exige `subscriptions.read` (OWNER/MANAGER) et toute modification de facturation exige `subscriptions.write` (OWNER uniquement).

Les quotas sont **appliqués côté serveur**, dans les transactions de création : la création d'un employé vérifie le quota de sièges, la création d'une réservation publique vérifie le quota mensuel de réservations et refuse les abonnements bloquants (`SUSPENDED`/`CANCELLED`/`EXPIRED` → `SUBSCRIPTION_INACTIVE`), et le worker de notifications saute l'envoi au-delà du quota mensuel (`NOTIFICATION_QUOTA_EXCEEDED`). Lorsqu'aucun abonnement n'existe, le plan `free` s'applique implicitement de sorte que les limites sont toujours en vigueur ; un quota `null` signifie illimité. Un dépassement renvoie `403` avec le code `QUOTA_EXCEEDED`.

Les paiements ne sont confirmés que par un webhook authentifié : `POST /api/v1/webhooks/payments` vérifie la signature HMAC-SHA256 (`x-signature`, secret `PAYMENTS_WEBHOOK_SECRET`) sur le corps brut, enregistre un `Payment` (idempotent sur `provider`+`reference`) et, sur `payment.succeeded`, passe l'abonnement à `ACTIVE` en étendant la période ; sur échec il passe à `PAST_DUE`. Aucun paiement n'est considéré confirmé sur la seule foi d'une requête non vérifiée. L'application effective des statuts dans le temps (passage automatique `TRIALING`→`EXPIRED` à l'échéance) reste à planifier via une tâche périodique.

## Tableau de bord et rapports

Les indicateurs sont agrégés côté serveur (jamais en téléchargeant toutes les réservations). `GET /api/v1/dashboard/summary?establishmentId=...&from=...&to=...` renvoie : rendez-vous du jour (fuseau de l'établissement), à venir, terminés, annulations, absences, nouveaux clients, services les plus réservés, taux d'occupation, notifications envoyées/échouées et consommation des quotas. Le taux d'occupation = minutes réservées (CONFIRMED+COMPLETED) / capacité horaire des employés actifs sur la fenêtre (règle explicitée dans la réponse ; approximation par jours locaux entiers). Les rapports `GET /api/v1/reports/bookings` (groupBy `day`|`employee`|`service`|`status`) et `GET /api/v1/reports/notifications` (groupBy `status`|`eventType`|`day`) renvoient des séries agrégées ; le découpage par jour utilise `date_trunc` au fuseau de l'établissement. Les fenêtres par défaut couvrent 30 jours et sont plafonnées à 186 jours. L'accès exige la permission `reports.read` (OWNER/MANAGER par défaut).

## Récupération de mot de passe et limitation de débit

`POST /api/v1/auth/forgot-password` émet un jeton de réinitialisation à usage unique, stocké uniquement sous forme hachée (SHA-256), valable `PASSWORD_RESET_TTL_SECONDS` (30 min par défaut) ; la réponse est toujours générique pour ne pas révéler l'existence d'un compte, et un seul jeton actif est conservé par utilisateur. L'envoi d'e-mail n'étant pas encore branché, le jeton brut est journalisé en niveau debug hors production. `POST /api/v1/auth/reset-password` valide le jeton (non expiré, non utilisé), met à jour le mot de passe (scrypt), marque le jeton consommé et révoque toutes les sessions de l'utilisateur.

La limitation de débit est assurée par un garde interne (décorateur `@Throttle`, fenêtre fixe par IP) appliqué aux routes sensibles : `login` (10/min), `register` (5/min), `refresh` (30/min), `forgot-password` (5/5 min), `reset-password` (10/5 min) et la création publique de réservation (20/min). Un dépassement renvoie `429` avec le code `TOO_MANY_REQUESTS` et un en-tête `Retry-After`. Le compteur est en mémoire (par instance) ; un déploiement multi-instances devra l'adosser à un stockage partagé (Redis) pour des limites globales. Le paquet `@nestjs/throttler` n'a pas été utilisé car sa version actuelle ne supporte pas encore NestJS 12.

Les JWT d'accès sont associés à une session active vérifiée en base ; la révocation ou la rotation invalide immédiatement les anciens jetons d'accès. Configurez `JWT_ACCESS_SECRET` avec au moins 32 octets aléatoires et définissez `JWT_ACCESS_TTL_SECONDS` et `JWT_REFRESH_TTL_SECONDS` selon la politique de déploiement. La limitation de débit et la récupération de mot de passe restent à mettre en place avant une exposition publique.

## Déploiement automatique

Le workflow `.github/workflows/ci-cd.yml` vérifie le backend et le frontend sur chaque pull request vers `main`, et déploie des previews Vercel pour les pull requests internes. Après fusion dans `main`, il applique les migrations Prisma puis déploie l'API et le frontend en production.

Configurez les secrets GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_FRONTEND` et `VERCEL_PROJECT_ID_BACKEND`. Ajoutez `NEON_MIGRATION_DATABASE_URL` comme secret de l'environnement GitHub `production` en utilisant une URL Neon directe (non poolée). Configurez séparément les variables d'environnement nécessaires aux previews et à la production dans les projets Vercel.

Les routes professionnelles de réservation vérifient l'adhésion active à l'établissement fourni. Les transitions d'état prennent aussi `establishmentId` en query string afin que la lecture initiale du rendez-vous soit tenant-scoped. Les permissions JSON d'une adhésion peuvent contenir `bookings.read` et `bookings.write` (booléens) ; `false` retire explicitement le droit accordé par défaut au rôle. Les employés restent limités à leurs propres réservations même si une permission est activée.

La gestion du tenant expose `GET/PATCH /api/v1/establishments/:establishmentId` pour le profil, `GET/POST /api/v1/establishments/:establishmentId/services`, `PATCH/DELETE /api/v1/establishments/:establishmentId/services/:serviceId` pour le catalogue et `GET/POST /api/v1/establishments/:establishmentId/employees`, `PATCH /api/v1/establishments/:establishmentId/employees/:employeeId` pour l'équipe. `POST /api/v1/establishments/:establishmentId/employees/invitations` crée une invitation valable sept jours ; `GET` sur la même route liste les invitations en attente et `DELETE .../employees/invitations/:invitationId` les révoque. Le jeton brut n'est retourné qu'à la création, et doit être transmis au destinataire par un canal sécurisé. L'acceptation crée un compte et une session avec `POST /api/v1/auth/invitations/accept` (jeton et mot de passe) ; un utilisateur existant, connecté avec l'adresse e-mail invitée, utilise `POST /api/v1/auth/invitations/accept-existing`. Les jetons sont stockés sous forme hachée et ne peuvent être acceptés qu'une seule fois. L'envoi d'e-mail n'est pas configuré. Les suppressions de services les désactivent afin de conserver l'historique des réservations. Les permissions d'adhésion correspondantes sont `establishments.read/write`, `services.read/write` et `employees.read/write` (ou les mêmes clés avec `:`) ; par défaut les rôles OWNER/MANAGER peuvent modifier et les membres actifs peuvent lire.

Les horaires hebdomadaires se consultent et se remplacent via `GET/PUT /api/v1/establishments/:establishmentId/business-hours`, avec un tableau `hours` d'intervalles locaux (`dayOfWeek` de 0 dimanche à 6 samedi, `opensAt`/`closesAt` au format `HH:mm`). Les horaires propres à un employé se gèrent sous `/employees/:employeeId/business-hours` et remplacent son planning d'établissement pour toute la semaine ; les jours omis restent fermés. Une journée peut contenir plusieurs intervalles non chevauchants. Sans aucun horaire configuré, la disponibilité historique par défaut reste 09:00-18:00. Les absences se listent via `GET /api/v1/establishments/:establishmentId/time-offs` (filtre optionnel `employeeId`, `from`, `to`; 100 résultats maximum), se créent via `POST` avec `employeeId`, `startsAt`, `endsAt` et `reason` optionnel, puis se suppriment avec `DELETE /time-offs/:timeOffId`. Une absence ne peut pas chevaucher une réservation en attente ou confirmée. Ces routes exigent `availability.read` ou `availability.write` dans les permissions d'adhésion.

Les clients d'un tenant se recherchent avec `GET /api/v1/establishments/:establishmentId/customers?q=...&cursor=...&limit=...` (nom ou téléphone normalisé, pagination par curseur), se consultent via `GET .../customers/:customerId` et leur historique paginé via `GET .../customers/:customerId/bookings`. Ces routes exigent `customers.read`. Un employé ne voit que les clients ayant au moins une réservation qui lui est assignée et l'historique ne retourne que ses réservations.
