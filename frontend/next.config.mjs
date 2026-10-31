/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le lint n'est pas requis pour vérifier le build du scaffold ; le
  // type-checking TypeScript reste actif.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
