import { useState } from 'react';
import * as XLSX from 'xlsx';
import FileUpload from './components/FileUpload';
import ProcessButton from './components/ProcessButton';
import { FileText } from 'lucide-react';

const Index = () => {
  const [kitoneFile, setKitoneFile] = useState<File | null>(null);
  const [zacFile, setZacFile] = useState<File | null>(null);
  const [dataCodeFile, setDataCodeFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  const handleProcess = async () => {
    if (kitoneFile && zacFile && uploadName) {
      setIsSubmitting(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      
      try {
        console.log('Processing files with name:', uploadName, {
          kitone: kitoneFile.name,
          zac: zacFile.name,
          dataCode: dataCodeFile ? dataCodeFile.name : 'Not provided',
          month: selectedMonth,
          year: selectedYear
        });

        // Process files for each type
        const kitoneData = await processFile(kitoneFile, 'kitone');
        const zacData = await processFile(zacFile, 'zac');
        const dataCodeData = dataCodeFile ? await processFile(dataCodeFile, 'dataCode') : null;

        // --- API call for Kintone (CRM) Upload ---
        const crmPayload = {
          name: uploadName,
          description: uploadDescription,
          file_name: kitoneFile.name,
          month: selectedMonth,
          year: selectedYear,
          records: kitoneData
        };
        
        const crmResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/upload/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crmPayload)
        });
        
        if (!crmResponse.ok) {
          throw new Error(`CRM upload failed: ${crmResponse.statusText}`);
        }

        // --- API call for ZAC (ERP) Upload ---
        const erpPayload = {
          name: uploadName,
          description: uploadDescription,
          file_name: zacFile.name,
          month: selectedMonth,
          year: selectedYear,
          records: zacData
        };
        
        const erpResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/upload/erp/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(erpPayload)
        });
        
        if (!erpResponse.ok) {
          throw new Error(`ERP upload failed: ${erpResponse.statusText}`);
        }

        // --- API call for DataCode Mapping Upload (if provided) ---
        if (dataCodeFile && dataCodeData) {
          const datacodePayload = {
            name: uploadName,
            description: uploadDescription,
            file_name: dataCodeFile.name,
            month: selectedMonth,
            year: selectedYear,
            records: dataCodeData
          };
          
          const dataCodeResponse = await fetch('https://dolbix-dev.test.studio.lyzr.ai/api/upload/datacode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datacodePayload)
          });
          
          if (!dataCodeResponse.ok) {
            throw new Error(`DataCode mapping upload failed: ${dataCodeResponse.statusText}`);
          }
        }

        setSuccessMessage("All files were uploaded and processed successfully!");

        // Reset form after successful upload
        setKitoneFile(null);
        setZacFile(null);
        setDataCodeFile(null);
        setUploadName('');
        setUploadDescription('');
      } catch (error) {
        console.error('Error processing files:', error);
        setErrorMessage(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsSubmitting(false);
      }
    } else {
      alert("Please select the required files and provide a name for this upload.");
      setErrorMessage("Please select the required files, provide a name, and select month/year for this upload.");
    }
  };

  const processFile = (file: File, type: 'kitone' | 'zac' | 'dataCode'): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (data) {
          try {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            let json;
            if (type === 'zac') {
              json = XLSX.utils.sheet_to_json(worksheet, { raw: false, range: 2 });
              json = processZacData(json); // custom processing for ZAC data
            } else {
              json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
            }

            console.log(`Processed ${type} data:`, json);
            resolve(json);
          } catch (error) {
            console.error(`Error processing ${type} file:`, error);
            reject(error);
          }
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const processZacData = (data: any[]) => {
    return data
      .map((row) => {
        const salespersonCode = String(row['Salesperson Code'] || row['営業担当者コード'] || '');
        if (
          salespersonCode.includes('(Subtotal)') ||
          salespersonCode.includes('(total)') ||
          salespersonCode.includes('（小計）') ||
          salespersonCode.includes('(合計)')
        ) {
          return null;
        }

        const salesPostingDate = row['Sales posting date'] || '';
        const month = setMonthFromDate(salesPostingDate);

        const processedRow: any = {};
        for (const key in row) {
          if (row[key] instanceof Date) {
            processedRow[key] = row[key].toISOString().replace('T', ' ').slice(0, 19);
          } else {
            processedRow[key] = row[key];
          }
        }

        processedRow['Month'] = month;
        return processedRow;
      })
      .filter((row) => row !== null);
  };

  const setMonthFromDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()];
  };

  return (
    <div className="">

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Upload Data Sources
            </h1>
            
          </div>

          {/* Name and Description Section */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center mb-3">
              <FileText className="w-4 h-4 text-purple-500 mr-2" />
              <h3 className="font-bold text-gray-700 text-sm">Add name and description for data files upload</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Enter a name for this upload"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of these files"
                />
              </div>
            </div>
            
            <div className='grid grid-cols-2 gap-4 mt-5'>
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Month <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="select-dropdown w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="" disabled>Select month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="select-dropdown w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
            </div>
              
            
          </div>
          
          
          
          {/* Files Section */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-bold text-gray-700 text-sm">Upload Data Files</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <FileUpload label="Kintone (CRM) Sheet" file={kitoneFile} onChange={setKitoneFile} />
              <FileUpload label="ZAC (ERP) Sheet" file={zacFile} onChange={setZacFile} />
              <FileUpload label="DataCode Mapping (Optional)" file={dataCodeFile} onChange={setDataCodeFile} />
            </div>
          </div>
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}
          <ProcessButton 
            onClick={handleProcess} 
            disabled={!kitoneFile || !zacFile || !uploadName || isSubmitting} 
          />
          
        </div>

    </div>
  );
};

export default Index;