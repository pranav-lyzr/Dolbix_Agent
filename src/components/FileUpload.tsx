import { ChangeEvent } from 'react';

interface FileUploadProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const FileUpload = ({ label, file, onChange }: FileUploadProps) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  return (
    <div className="flex flex-col">
      <label className="text-lg font-semibold mb-2 text-blue-700">{label}</label>
      <div className={`
        relative border-2 border-dashed rounded-lg p-8
        ${file ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:border-blue-400'}
        transition-colors duration-200 cursor-pointer
      `}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {file ? (
            <>
              <p className="text-blue-600 font-medium mb-1">{file.name}</p>
              <p className="text-sm text-blue-500">Click to change file</p>
            </>
          ) : (
            <>
              <p className="text-blue-600 font-medium mb-1">Drop your Excel file here</p>
              <p className="text-sm text-blue-500">or click to browse</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;