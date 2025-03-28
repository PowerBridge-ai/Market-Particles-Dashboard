'use client';

import dynamic from 'next/dynamic';

const MarketParticlesV3 = dynamic(
  () => import('../components/MarketParticlesV3').then(mod => ({ default: mod.MarketParticlesV3 })),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen">
      <MarketParticlesV3 autoFetch={true} />
    </main>
  );
} 