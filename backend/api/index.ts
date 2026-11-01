// Fonction serverless Vercel. Réexporte le handler bundlé et autonome
// (serverless/bundle.mjs, généré au build) : aucune dépendance à dist/ ou à
// node_modules au runtime.
// @ts-expect-error — bundle.mjs est produit par le build (scripts/build-serverless.mjs).
export { default } from '../serverless/bundle.mjs';
