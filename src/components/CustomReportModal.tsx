import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Check } from 'lucide-react';

type UploadData = {
  upload_id: number;
  file_name: string;
  name: string;
  month: string;
  year: string;
  description: string;
  timestamp: string;
};

type CustomReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedData: {
    crm_id?: number;
    erp_id?: number;
    datacode_id?: number;
    name: string;
  }) => void;
};

const CustomReportModal: React.FC<CustomReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [crmData, setCrmData] = useState<UploadData[]>([]);
  const [erpData, setErpData] = useState<UploadData[]>([]);
  const [datacodeData, setDatacodeData] = useState<UploadData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [reportName, setReportName] = useState('');
  
  const [selectedCrmId, setSelectedCrmId] = useState<number | undefined>(undefined);
  const [selectedErpId, setSelectedErpId] = useState<number | undefined>(undefined);
  const [selectedDatacodeId, setSelectedDatacodeId] = useState<number | undefined>(undefined);

  // Years and months for filtering
  const years = Array.from(new Set([...crmData, ...erpData, ...datacodeData].map(item => item.year))).sort();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Filtered data based on selected year and month
  const filteredCrmData = crmData.filter(item => 
    (!selectedYear || item.year === selectedYear) && 
    (!selectedMonth || item.month === selectedMonth)
  );
  
  const filteredErpData = erpData.filter(item => 
    (!selectedYear || item.year === selectedYear) && 
    (!selectedMonth || item.month === selectedMonth)
  );
  
  const filteredDatacodeData = datacodeData.filter(item => 
    (!selectedYear || item.year === selectedYear) && 
    (!selectedMonth || item.month === selectedMonth)
  );

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch CRM data
      const crmResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/uploads/crm');
      if (!crmResponse.ok) throw new Error('Failed to fetch CRM data');
      const crmResult = await crmResponse.json();
      setCrmData(crmResult);
      
      // Fetch ERP data
      const erpResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/uploads/erp');
      if (!erpResponse.ok) throw new Error('Failed to fetch ERP data');
      const erpResult = await erpResponse.json();
      setErpData(erpResult);
      
      // Fetch Datacode data
      const datacodeResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/uploads/datacode');
      if (!datacodeResponse.ok) throw new Error('Failed to fetch Datacode data');
      const datacodeResult = await datacodeResponse.json();
      setDatacodeData(datacodeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    onSubmit({
      crm_id: selectedCrmId,
      erp_id: selectedErpId,
      datacode_id: selectedDatacodeId,
      name: reportName,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white rounded-xl p-6 shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Custom Report Generation</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="reportName" className="block text-sm font-medium text-gray-700 mb-1">
                Report Name
              </label>
              <input
                type="text"
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Enter a name for your report"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">All Months</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <DataSelector
                title="CRM Data"
                data={filteredCrmData}
                selectedId={selectedCrmId}
                onSelect={setSelectedCrmId}
                isLoading={isLoading}
              />
              
              <DataSelector
                title="ERP Data"
                data={filteredErpData}
                selectedId={selectedErpId}
                onSelect={setSelectedErpId}
                isLoading={isLoading}
              />
              
              <DataSelector
                title="Datacode"
                data={filteredDatacodeData}
                selectedId={selectedDatacodeId}
                onSelect={setSelectedDatacodeId}
                isLoading={isLoading}
              />
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 mr-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={isLoading || (!selectedCrmId && !selectedErpId && !selectedDatacodeId)}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface DataSelectorProps {
  title: string;
  data: UploadData[];
  selectedId?: number;
  onSelect: (id?: number) => void;
  isLoading: boolean;
}

const DataSelector: React.FC<DataSelectorProps> = ({
  title,
  data,
  selectedId,
  onSelect,
  isLoading,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <h3 className="text-lg font-medium text-gray-800 mb-3">{title}</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <FileSpreadsheet className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <div className="space-y-2 h-48 overflow-y-auto pr-2">
          {data.map((item) => (
            <button
              key={item.upload_id}
              onClick={() => onSelect(selectedId === item.upload_id ? undefined : item.upload_id)}
              className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                selectedId === item.upload_id 
                  ? 'bg-purple-100 border-purple-300 border' 
                  : 'bg-white border border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-[180px]">{item.name}</span>
                <span className="text-xs text-gray-500">
                  {item.month} {item.year}
                </span>
              </div>
              
              {selectedId === item.upload_id && (
                <span className="flex-shrink-0">
                  <Check className="w-5 h-5 text-purple-600" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomReportModal;