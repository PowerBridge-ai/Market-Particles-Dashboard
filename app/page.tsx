import React from 'react'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Market Particles Dashboard</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-center mb-4">Simple version without 3D visualization</p>
          
          <div className="bg-gray-900 rounded p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Market Data</h2>
            <p>BTC: $65,432.10</p>
            <p>ETH: $3,789.45</p>
            <p>SOL: $142.81</p>
          </div>
          
          <div className="text-center text-gray-400">
            <p>Simplified demo version</p>
          </div>
        </div>
      </div>
    </main>
  )
} 