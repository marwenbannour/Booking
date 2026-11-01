// Bundle l'entrée serverless (serverless/server.ts) + l'app compilée (dist/)
// en un seul fichier autonome serverless/bundle.mjs pour la fonction Vercel.
import { build } from 'esbuild';

// Dépendances optionnelles (transports Nest, moteurs de templates, binaires
// natifs facultatifs) jamais exécutées ici : on les laisse externes pour ne
// pas casser le bundle.
const external = [
  '@nestjs/microservices',
  '@nestjs/websockets',
  '@nestjs/platform-socket.io',
  '@nestjs/platform-fastify',
  '@fastify/static',
  '@fastify/view',
  'cache-manager',
  '@grpc/grpc-js',
  '@grpc/proto-loader',
  'kafkajs',
  'mqtt',
  'nats',
  'amqplib',
  'amqp-connection-manager',
  'redis',
  '@apollo/server',
  'ts-morph',
  'hbs',
  'pug',
  'ejs',
  'pg-native',
  'bufferutil',
  'utf-8-validate',
  // NB : ne PAS externaliser 'class-transformer/storage' — cela scinde le
  // metadata storage et casse les DTO mapped-types (@nestjs/swagger PartialType).
];

await build({
  entryPoints: ['serverless/server.ts'],
  outfile: 'serverless/bundle.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external,
  banner: {
    js: "import{createRequire as __cr}from'module';const require=__cr(import.meta.url);",
  },
  logLevel: 'info',
  legalComments: 'none',
});

console.log('serverless/bundle.mjs built');
