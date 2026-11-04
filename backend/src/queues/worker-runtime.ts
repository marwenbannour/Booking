export function areWorkersEnabled(
  environment: { VERCEL?: string; WORKERS_ENABLED?: string } = process.env,
): boolean {
  return environment.VERCEL !== '1' && environment.WORKERS_ENABLED !== 'false';
}
