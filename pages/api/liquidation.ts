import { NextApiRequest, NextApiResponse } from 'next';
import { generateMockLiquidationEvent } from '@/utils/dataUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Generate a mock liquidation event
    const liquidationEvent = generateMockLiquidationEvent();
    
    // Return the liquidation event
    res.status(200).json(liquidationEvent);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch liquidation data' });
  }
} 