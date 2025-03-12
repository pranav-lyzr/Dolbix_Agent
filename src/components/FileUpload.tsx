import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';



interface FileUploadProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const FileUpload = ({ label, file, onChange }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onChange(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
        } cursor-pointer flex flex-col items-center justify-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          ref={fileInputRef}
        />

        {file ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                <p className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-center">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">Excel files only (XLSX, XLS)</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;