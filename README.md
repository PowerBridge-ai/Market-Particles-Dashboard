# Market Particles Dashboard 🌌

An interactive market data visualization dashboard featuring three different particle-based visualizations. Built with Next.js and ready for one-click deployment to Vercel.

![Market Particles Dashboard](https://via.placeholder.com/1200x600?text=Market+Particles+Dashboard)

## 🚀 Features

- Three visualization types:
  - **Basic Particles**: Simple, lightweight 3D particle system
  - **Galaxy Visualization**: Spiral galaxy visualization with market data mapped to stars
  - **Force Graph**: 3D network graph with token correlations
- Multiple data source options:
  - Mock data (generated in real-time)
  - Demo data (preloaded samples)
  - API endpoints
  - CSV files
  - JSON files
  - YAML files
  - PostgreSQL database queries
- Real-time market metrics display
- Customizable visualization settings
- Responsive design for all devices

## 🔧 Quick Deploy

The fastest way to get started is to deploy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fmarket-particles-dashboard)

## 🛠️ Local Development

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/market-particles-dashboard.git
   cd market-particles-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Data Sources

The dashboard supports multiple data sources:

### Mock Data
- Automatically generated market data
- Configurable number of tokens and liquidations
- Randomized values for testing

### Demo Data
- Pre-loaded sample data included with the application
- Provides a consistent dataset for demonstration

### API Endpoint
- Connect to any API that returns market data in the expected format
- Example API format:
  ```json
  {
    "tokens": [
      {
        "symbol": "BTC",
        "price": 66247.85,
        "volume": 25841932855,
        "price_change_24h": 1.23,
        "mark_price": 66250.12,
        "funding_rate": 0.0001
      },
      ...
    ],
    "liquidations": [
      {
        "type": "long",
        "amount": 2547896,
        "symbol": "BTC"
      },
      ...
    ]
  }
  ```

### CSV Format
- Upload or paste CSV data
- Required token columns: `symbol,price,volume,price_change_24h`
- Optional token columns: `mark_price,funding_rate`
- For liquidations: `type,amount,symbol`

### JSON/YAML Format
- Follows the same structure as the API endpoint format
- Can be pasted directly into the dashboard

### PostgreSQL
- Connect to any PostgreSQL database
- Specify custom queries for tokens and liquidations
- Required token columns: `symbol,price,volume,price_change_24h`
- Optional token columns: `mark_price,funding_rate`
- For liquidations: `type,amount,symbol`

## 🎨 Visualization Types

### Basic Particles
- Lightweight 3D particle system using Three.js
- Particles respond to market data changes
- Good for low-powered devices

### Galaxy Visualization
- Spiral galaxy visualization with configurable arms
- Token volume determines star brightness and size
- Price changes influence rotation and movement
- Rich configuration options

### Force Graph
- 3D force-directed graph using 3d-force-graph
- Token correlation mapping using price/volume relationships
- Interactive navigation (zoom, pan, rotate)
- Directional particles flowing along links
- Comprehensive configuration options

## ⚙️ Configuration Options

The dashboard provides extensive configuration options for the visualizations:

### Galaxy Settings
- Number of spiral arms
- Spiral tightness
- Galaxy radius
- Core radius
- Vertical dispersion
- Rotation speed

### Force Graph Settings
- Visualization mode (volume, volatility, momentum, liquidations)
- Correlation type (price, volume, volatility, combined)
- Correlation threshold
- Node size and color
- Link properties
- Force parameters

## 🔄 API Routes

The dashboard includes several API routes:

- `/api/market-data` - Get market data from various sources
- `/api/liquidation` - Get liquidation events
- `/api/parse-file` - Parse uploaded file content (CSV, JSON, YAML)
- `/api/query-postgres` - Query PostgreSQL database

## 📱 Responsive Design

The dashboard is fully responsive and works on all devices:
- Desktop: Full layout with all features
- Tablet: Optimized layout with most features
- Mobile: Simplified layout focused on visualization

## 🔒 Environment Variables

For production deployments, you can set the following environment variables:

- `NEXT_PUBLIC_API_URL` - Default API URL for market data
- `DATABASE_URL` - PostgreSQL connection string (if needed)

## 📄 License

MIT 