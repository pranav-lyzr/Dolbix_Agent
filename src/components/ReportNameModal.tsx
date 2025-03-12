import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ReportNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  action: 'generate' | 'regenerate';
}

const ReportNameModal = ({ isOpen, onClose, onSubmit, action }: ReportNameModalProps) => {
  const [reportName, setReportName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportName.trim()) {
      onSubmit(reportName);
      setReportName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all"
        style={{ 
          animation: 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-lg font-medium">
            {action === 'generate' ? 'Name Your New Report' : 'Name Your Regenerated Report'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4">
            <label htmlFor="reportName" className="block text-sm font-medium text-gray-700 mb-1">
              Report Name
            </label>
            <input
              type="text"
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter a name for your report"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={!reportName.trim()}
            >
              {action === 'generate' ? 'Generate Report' : 'Regenerate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportNameModal;