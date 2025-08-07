// frontend/src/components/modals/CsvImportModal.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CsvImportModalProps {
  show: boolean;
  headers: string[];
  selectedColumn: string;
  onClose: () => void;
  onImport: () => void;
  onColumnChange: (value: string) => void;
}

export const CsvImportModal = ({
  show,
  headers,
  selectedColumn,
  onClose,
  onImport,
  onColumnChange,
}: CsvImportModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full">
        <h2 className="text-xl font-bold mb-4">Select Domain Column</h2>
        <div className="space-y-2 mb-4">
          <Label>Available Columns:</Label>
          <Select value={selectedColumn} onValueChange={onColumnChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onImport}>Import</Button>
        </div>
      </div>
    </div>
  );
};