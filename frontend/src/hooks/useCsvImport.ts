// frontend/src/hooks/useCsvImport.ts
import { useState } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export interface CsvImportState<T> {
  show: boolean;
  headers: string[];
  data: T[];
  selectedColumn: string;
}

export const useCsvImport = <T>() => {
  const [importState, setImportState] = useState<CsvImportState<T>>({
    show: false,
    headers: [],
    data: [],
    selectedColumn: '',
  });

  const openCsvImportModal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.meta.fields.length > 0) {
          setImportState({
            show: true,
            headers: results.meta.fields,
            data: results.data as T[],
            selectedColumn: results.meta.fields[0] || '',
          });
        } else {
          toast.error("Could not read headers from the CSV file.");
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file.");
        console.error("CSV Parsing Error:", error);
      }
    });
    event.target.value = ''; // Reset file input
  };

  const closeCsvImportModal = () => {
    setImportState(prev => ({ ...prev, show: false }));
};

return {
  importState,
  setImportState,
  openCsvImportModal,
  closeCsvImportModal,
};
};