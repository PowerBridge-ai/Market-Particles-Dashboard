import * as React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import Dashboard component to avoid SSR issues
const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Market Particles Dashboard</title>
        <meta name="description" content="Interactive market data visualization with particle animations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Dashboard />
      </main>
    </>
  );
} 