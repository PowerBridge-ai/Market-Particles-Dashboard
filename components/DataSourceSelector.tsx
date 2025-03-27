import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface DataSourceSelectorProps {
  onDataSourceChange: (dataSource: any) => void;
}

type DataSourceType = 'mock' | 'demo' | 'api' | 'csv' | 'json' | 'yaml' | 'postgres';

interface FormData {
  sourceType: DataSourceType;
  mockTokenCount?: number;
  mockLiquidationCount?: number;
  apiUrl?: string;
  postgresConnectionString?: string;
  postgresTokensQuery?: string;
  postgresLiquidationsQuery?: string;
  fileContent?: string;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ onDataSourceChange }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      sourceType: 'mock',
      mockTokenCount: 20,
      mockLiquidationCount: 5,
    }
  });
  
  const sourceType = watch('sourceType');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (data.sourceType) {
        case 'mock':
          const mockResponse = await fetch(`/api/market-data?source=mock&tokens=${data.mockTokenCount}&liquidations=${data.mockLiquidationCount}`);
          if (!mockResponse.ok) throw new Error('Failed to fetch mock data');
          const mockData = await mockResponse.json();
          onDataSourceChange(mockData);
          break;
          
        case 'demo':
          const demoResponse = await fetch('/api/market-data?source=demo');
          if (!demoResponse.ok) throw new Error('Failed to fetch demo data');
          const demoData = await demoResponse.json();
          onDataSourceChange(demoData);
          break;
          
        case 'api':
          if (!data.apiUrl) throw new Error('API URL is required');
          const apiResponse = await fetch(`/api/market-data?source=${encodeURIComponent(data.apiUrl)}`);
          if (!apiResponse.ok) throw new Error('Failed to fetch API data');
          const apiData = await apiResponse.json();
          onDataSourceChange(apiData);
          break;
          
        case 'csv':
        case 'json':
        case 'yaml':
          if (!data.fileContent) throw new Error('File content is required');
          const fileResponse = await fetch('/api/parse-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: data.fileContent, type: data.sourceType }),
          });
          if (!fileResponse.ok) throw new Error(`Failed to parse ${data.sourceType.toUpperCase()} data`);
          const fileData = await fileResponse.json();
          onDataSourceChange(fileData);
          break;
          
        case 'postgres':
          if (!data.postgresConnectionString) throw new Error('Connection string is required');
          if (!data.postgresTokensQuery) throw new Error('Tokens query is required');
          const postgresResponse = await fetch('/api/query-postgres', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connectionString: data.postgresConnectionString,
              tokensQuery: data.postgresTokensQuery,
              liquidationsQuery: data.postgresLiquidationsQuery || '',
            }),
          });
          if (!postgresResponse.ok) throw new Error('Failed to query PostgreSQL');
          const postgresData = await postgresResponse.json();
          onDataSourceChange(postgresData);
          break;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-dark-lighter rounded-lg p-4 mb-4 text-white">
      <h2 className="text-xl font-bold mb-4">Data Source Configuration</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block mb-2">Data Source Type</label>
          <select 
            {...register('sourceType')} 
            className="w-full bg-dark p-2 rounded"
          >
            <option value="mock">Mock Data (Generated)</option>
            <option value="demo">Demo Data</option>
            <option value="api">API Endpoint</option>
            <option value="csv">CSV File</option>
            <option value="json">JSON File</option>
            <option value="yaml">YAML File</option>
            <option value="postgres">PostgreSQL</option>
          </select>
        </div>
        
        {sourceType === 'mock' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Token Count</label>
              <input 
                type="number" 
                {...register('mockTokenCount', { min: 1, max: 100 })} 
                className="w-full bg-dark p-2 rounded"
              />
              {errors.mockTokenCount && (
                <p className="text-red-500 text-sm mt-1">Must be between 1 and 100</p>
              )}
            </div>
            <div>
              <label className="block mb-2">Liquidation Count</label>
              <input 
                type="number" 
                {...register('mockLiquidationCount', { min: 0, max: 50 })} 
                className="w-full bg-dark p-2 rounded"
              />
              {errors.mockLiquidationCount && (
                <p className="text-red-500 text-sm mt-1">Must be between 0 and 50</p>
              )}
            </div>
          </div>
        )}
        
        {sourceType === 'api' && (
          <div className="mb-4">
            <label className="block mb-2">API URL</label>
            <input 
              type="text" 
              {...register('apiUrl', { required: true })} 
              className="w-full bg-dark p-2 rounded"
              placeholder="https://api.example.com/market-data"
            />
            {errors.apiUrl && (
              <p className="text-red-500 text-sm mt-1">API URL is required</p>
            )}
          </div>
        )}
        
        {['csv', 'json', 'yaml'].includes(sourceType) && (
          <div className="mb-4">
            <label className="block mb-2">{sourceType.toUpperCase()} Content</label>
            <textarea 
              {...register('fileContent', { required: true })} 
              className="w-full bg-dark p-2 rounded h-40 font-mono text-sm"
              placeholder={`Paste your ${sourceType.toUpperCase()} content here...`}
            />
            {errors.fileContent && (
              <p className="text-red-500 text-sm mt-1">Content is required</p>
            )}
          </div>
        )}
        
        {sourceType === 'postgres' && (
          <>
            <div className="mb-4">
              <label className="block mb-2">Connection String</label>
              <input 
                type="text" 
                {...register('postgresConnectionString', { required: true })} 
                className="w-full bg-dark p-2 rounded"
                placeholder="postgres://username:password@localhost:5432/database"
              />
              {errors.postgresConnectionString && (
                <p className="text-red-500 text-sm mt-1">Connection string is required</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Tokens Query</label>
              <textarea 
                {...register('postgresTokensQuery', { required: true })} 
                className="w-full bg-dark p-2 rounded h-20 font-mono text-sm"
                placeholder="SELECT symbol, price, volume, price_change_24h, mark_price, funding_rate FROM tokens"
              />
              {errors.postgresTokensQuery && (
                <p className="text-red-500 text-sm mt-1">Tokens query is required</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Liquidations Query (Optional)</label>
              <textarea 
                {...register('postgresLiquidationsQuery')} 
                className="w-full bg-dark p-2 rounded h-20 font-mono text-sm"
                placeholder="SELECT type, amount, symbol FROM liquidations"
              />
            </div>
          </>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="bg-primary hover:bg-primary-dark px-4 py-2 rounded transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Data'}
        </button>
      </form>
    </div>
  );
};

export default DataSourceSelector; 