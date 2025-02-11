import { useState } from 'react';
import * as XLSX from 'xlsx';
import FileUpload from './components/FileUpload';
import ProcessButton from './components/ProcessButton';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [kitoneFile, setKitoneFile] = useState<File | null>(null);
  const [zacFile, setZacFile] = useState<File | null>(null);
  const [dataCodeFile, setDataCodeFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleProcess = async () => {
    if (kitoneFile && zacFile && dataCodeFile) {
      console.log('Processing files:', {
        kitone: kitoneFile.name,
        zac: zacFile.name,
        dataCode: dataCodeFile.name
      });

      // Process files
      const kitoneData = await processFile(kitoneFile, 'kitone');
      const zacData = await processFile(zacFile, 'zac');
      const dataCodeData = await processFile(dataCodeFile, 'dataCode');

      // Ensure all files are processed
      if (kitoneData && zacData && dataCodeData) {
        console.log("Navigating to /report", typeof(kitoneData), zacData, dataCodeData);
        // Navigate to /report and pass the processed data as state
        navigate('/report', { state: { kitoneData, zacData, dataCodeData } });
      }
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
              json = processZacData(json); // Process ZAC data
            } else if (type === 'dataCode') {
              json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
              // Add any specific processing for dataCode files here if needed
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
        const salespersonCode = String(row['Salesperson Code'] || '');
        // Remove rows with "(Subtotal)" or "(total)" in Salesperson Code
        if (salespersonCode.includes('(Subtotal)') || salespersonCode.includes('(total)')) {
          return null;
        }

        // Extract month from Sales posting date
        const salesPostingDate = row['Sales posting date'] || '';
        const month = setMonthFromDate(salesPostingDate);

        // Convert datetime columns to string
        const processedRow: any = {};
        for (const key in row) {
          if (row[key] instanceof Date) {
            processedRow[key] = row[key].toISOString().replace('T', ' ').slice(0, 19);
          } else {
            processedRow[key] = row[key];
          }
        }

        // Add month to the row
        processedRow['Month'] = month;

        return processedRow;
      })
      .filter((row) => row !== null); // Remove null rows
  };

  const setMonthFromDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return months[date.getMonth()];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
            Dolbix Performance Report Generator
          </h1>
          <p className="text-center mb-12 text-gray-600">
            Upload your Kitone, ZAC (ERP), and DataCode Mapping sheets for processing
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <FileUpload
              label="Kintone (CRM) Sheet"
              file={kitoneFile}
              onChange={setKitoneFile}
            />
            <FileUpload
              label="ZAC (ERP) Sheet"
              file={zacFile}
              onChange={setZacFile}
            />
            <FileUpload
              label="DataCode Mapping Sheet"
              file={dataCodeFile}
              onChange={setDataCodeFile}
            />
          </div>

          <ProcessButton
            onClick={handleProcess}
            disabled={!kitoneFile || !zacFile || !dataCodeFile}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;