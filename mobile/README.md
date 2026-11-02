# Book&Whats Mobile

Application native React Native + Expo + TypeScript, conçue pour Android et iOS autour de la charte Book&Whats.

## Configuration locale

```powershell
Copy-Item .env.example .env
```

Renseignez `EXPO_PUBLIC_ESTABLISHMENT_SLUG` avec le slug public de l’établissement. Définissez également `EXPO_PUBLIC_API_URL` :

- iOS Simulator : `http://localhost:3000/api/v1`
- Android Emulator : `http://10.0.2.2:3000/api/v1`
- Téléphone physique : URL joignable depuis le téléphone (IP locale du serveur ou API déployée)

Les variables `EXPO_PUBLIC_*` sont intégrées au bundle client et ne doivent contenir aucun secret.

## Démarrer

```powershell
npm install
npm start
```

For a browser preview of the mobile interface, run `npm run web`.

Cette application cible Expo SDK 58. Utilisez un development build pour la lancer sur un appareil ; Expo Go physique est limité au SDK 57 pendant la transition du SDK. La compilation native iOS locale nécessite macOS, ou un build cloud EAS.

Sous Windows, installez également CMake 3.31.6 depuis Android Studio > SDK Manager > SDK Tools > CMake (Show Package Details). La configuration Expo sélectionne cette version pour éviter la limite de chemins du Ninja livré avec CMake 3.22.1.

Le parcours public charge les services, employés et disponibilités de l’API, puis crée le rendez-vous avec une clé d’idempotence. Le consentement WhatsApp est facultatif et décoché par défaut.

Les reçus des cinq dernières réservations sont conservés chiffrés sur l’appareil afin de rester visibles après fermeture de l’application. Ils ne sont pas synchronisés avec le serveur et ne permettent pas encore de modifier ou d’annuler une réservation.

L’application mobile est disponible en français et en arabe. Changez de langue depuis **Profil > Langue** ; la préférence est conservée sur l’appareil, l’interface arabe adapte l’alignement et le sens de lecture, et la langue choisie est transmise avec la réservation pour les notifications WhatsApp.

Pour vérifier les bundles de production Android et iOS, lancez `npm run build`.
