import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, parseJSON, parseYAML } from '../../utils/dataUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!type || !['csv', 'json', 'yaml'].includes(type)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Parse the content based on the file type
    let data;
    switch (type) {
      case 'csv':
        data = await parseCSV(content);
        break;
      case 'json':
        data = await parseJSON(content);
        break;
      case 'yaml':
        data = await parseYAML(content);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    // Return the parsed data
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Parse file error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse file' });
  }
} 