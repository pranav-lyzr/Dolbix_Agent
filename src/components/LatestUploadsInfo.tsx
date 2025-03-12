import { useEffect, useState } from 'react';

type UploadInfo = {
  name: string;
  timestamp: string;
  upload_id: number;
};

type UploadsData = {
  crm: UploadInfo;
  erp: UploadInfo;
  datacode: UploadInfo;
};

const LatestUploadsInfo = () => {
  const [uploadsData, setUploadsData] = useState<UploadsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchLatestUploads = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/latest_uploads');
        if (!response.ok) {
          throw new Error('Failed to fetch latest uploads');
        }
        const data = await response.json();
        setUploadsData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching latest uploads:', err);
        setError('Failed to load data source information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestUploads();
  }, []);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading data sources...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (!uploadsData) {
    return <div className="text-sm text-gray-500">No data source information available</div>;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <span>Data source: {uploadsData?.crm?.name ?? 'N/A'}</span>
        <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>
      
      {isExpanded && uploadsData && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 min-w-[280px]">
          <div className="space-y-3">
            {uploadsData.crm && (
              <div>
                <p className="text-sm">Name: {uploadsData.crm.name ?? 'N/A'}</p>
                <p className="text-xs text-gray-400">
                  Date: {uploadsData.crm.timestamp ? formatDate(uploadsData.crm.timestamp) : 'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
};

export default LatestUploadsInfo;
