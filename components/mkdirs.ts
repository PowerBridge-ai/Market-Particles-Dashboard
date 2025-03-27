// This file ensures all required directories are created during build
import fs from 'fs';
import path from 'path';

// Create directories if they don't exist
const directories = [
  'public',
  'styles',
  'data'
];

// Create each directory
directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Copy demo data files if they don't exist in the data directory
const dataDir = path.join(process.cwd(), 'data');
const demoFiles = [
  'demo.json',
  'demo.csv',
  'demo.yml'
];

// Example JSON data
const jsonData = {
  tokens: [
    {
      symbol: "BTC",
      price: 66247.85,
      volume: 25841932855,
      price_change_24h: 1.23,
      mark_price: 66250.12,
      funding_rate: 0.0001
    },
    {
      symbol: "ETH",
      price: 3430.56,
      volume: 12547896321,
      price_change_24h: -0.45,
      mark_price: 3429.98,
      funding_rate: 0.0002
    }
  ],
  liquidations: [
    {
      type: "long",
      amount: 2547896,
      symbol: "BTC"
    },
    {
      type: "short",
      amount: 1569874,
      symbol: "ETH"
    }
  ]
};

// Example CSV data
const csvData = `symbol,price,volume,price_change_24h,mark_price,funding_rate
BTC,66247.85,25841932855,1.23,66250.12,0.0001
ETH,3430.56,12547896321,-0.45,3429.98,0.0002

type,amount,symbol
long,2547896,BTC
short,1569874,ETH`;

// Example YAML data
const yamlData = `tokens:
  - symbol: BTC
    price: 66247.85
    volume: 25841932855
    price_change_24h: 1.23
    mark_price: 66250.12
    funding_rate: 0.0001
  - symbol: ETH
    price: 3430.56
    volume: 12547896321
    price_change_24h: -0.45
    mark_price: 3429.98
    funding_rate: 0.0002

liquidations:
  - type: long
    amount: 2547896
    symbol: BTC
  - type: short
    amount: 1569874
    symbol: ETH`;

// Create demo files
if (!fs.existsSync(path.join(dataDir, 'demo.json'))) {
  fs.writeFileSync(path.join(dataDir, 'demo.json'), JSON.stringify(jsonData, null, 2));
  console.log('Created demo.json');
}

if (!fs.existsSync(path.join(dataDir, 'demo.csv'))) {
  fs.writeFileSync(path.join(dataDir, 'demo.csv'), csvData);
  console.log('Created demo.csv');
}

if (!fs.existsSync(path.join(dataDir, 'demo.yml'))) {
  fs.writeFileSync(path.join(dataDir, 'demo.yml'), yamlData);
  console.log('Created demo.yml');
}

// Export an empty object to make TypeScript happy
export {}; 