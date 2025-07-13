'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ColumnMappingProps {
  headers: string[];
  columnTypes: Record<string, string>;
  suggestions: Array<{
    sourceColumn: string;
    targetField: string;
    isRequired: boolean;
  }>;
  targetFields: Array<{
    field: string;
    label: string;
    required: boolean;
  }>;
  onChange: (mapping: Record<string, string>) => void;
}

export function ColumnMapping({
  headers,
  columnTypes,
  suggestions,
  targetFields,
  onChange,
}: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    suggestions.forEach((s) => {
      initial[s.targetField] = s.sourceColumn;
    });
    return initial;
  });

  const updateMapping = (targetField: string, sourceColumn: string) => {
    const newMapping = { ...mapping };
    if (sourceColumn === 'none') {
      delete newMapping[targetField];
    } else {
      newMapping[targetField] = sourceColumn;
    }
    setMapping(newMapping);
    onChange(newMapping);
  };

  const getColumnBadge = (column: string) => {
    const type = columnTypes[column];
    const colors: Record<string, string> = {
      email: 'bg-blue-100 text-blue-700',
      phone: 'bg-green-100 text-green-700',
      url: 'bg-purple-100 text-purple-700',
      name: 'bg-orange-100 text-orange-700',
      company: 'bg-indigo-100 text-indigo-700',
      text: 'bg-gray-100 text-gray-700',
    };
    
    return (
      <Badge variant="outline" className={colors[type] || colors.text}>
        {type}
      </Badge>
    );
  };

  const missingRequired = targetFields
    .filter((f) => f.required && !mapping[f.field])
    .map((f) => f.label);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Map Your Columns</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Match your CSV columns to the enrichment fields. We've suggested some mappings based on your column names.
        </p>
      </div>

      {missingRequired.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing required fields: {missingRequired.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {targetFields.map((field) => (
          <div key={field.field} className="grid grid-cols-2 gap-4 items-center">
            <div>
              <Label className="flex items-center gap-2">
                {field.label}
                {field.required && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
            </div>
            <Select
              value={mapping[field.field] || 'none'}
              onValueChange={(value) => updateMapping(field.field, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    <div className="flex items-center justify-between w-full">
                      <span>{header}</span>
                      {getColumnBadge(header)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Column Type Detection</h4>
        <p className="text-sm text-muted-foreground">
          We automatically detected the following column types to help with mapping:
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(columnTypes).map(([column, type]) => (
            <div key={column} className="flex items-center gap-1">
              <span className="text-sm">{column}:</span>
              {getColumnBadge(column)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}