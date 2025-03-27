import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { generateMockData, generateMockLiquidationEvent, parseJSON } from '@/utils/dataUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check data source parameter
    const source = req.query.source?.toString() || 'mock';
    
    // If mock data is requested, generate it
    if (source === 'mock') {
      const tokenCount = parseInt(req.query.tokens?.toString() || '20');
      const liquidationCount = parseInt(req.query.liquidations?.toString() || '5');
      const mockData = generateMockData(tokenCount, liquidationCount);
      return res.status(200).json(mockData);
    }
    
    // If demo data is requested, load from file
    if (source === 'demo') {
      const filePath = path.join(process.cwd(), 'data', 'demo.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const demoData = JSON.parse(fileContent);
      return res.status(200).json(demoData);
    }
    
    // If a URL is provided, fetch from it
    if (source.startsWith('http')) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    // Default to mock data if no valid source is provided
    const mockData = generateMockData();
    res.status(200).json(mockData);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
} 