import { NextApiRequest, NextApiResponse } from 'next';
import { queryFromPostgres } from '@/utils/dataUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { connectionString, tokensQuery, liquidationsQuery } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }
    
    if (!tokensQuery) {
      return res.status(400).json({ error: 'Tokens query is required' });
    }
    
    // Query the database
    const data = await queryFromPostgres(
      connectionString,
      tokensQuery,
      liquidationsQuery
    );
    
    // Return the query results
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('PostgreSQL query error:', error);
    return res.status(500).json({ error: error.message || 'Failed to query PostgreSQL' });
  }
} 