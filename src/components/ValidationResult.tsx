import React from 'react';

interface ValidationResultProps {
  result: {
    documentType?: string;
    extractedFields?: any;
    validationStatus?: 'PASS' | 'FAIL' | 'WARNING';
    issues?: Array<{
      field: string;
      severity: 'ERROR' | 'WARNING';
      message: string;
    }>;
    confidence?: number;
    rawResponse?: string;
  };
}

export function ValidationResult({ result }: ValidationResultProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-100 text-green-800 border-green-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAIL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => severity === 'ERROR'
    ? 'bg-red-50 border-red-300 text-red-900'
    : 'bg-yellow-50 border-yellow-300 text-yellow-900';

  if (result.rawResponse && !result.validationStatus) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Raw Response</h2>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">{result.rawResponse}</pre>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validation Result</h2>
          {result.documentType && (
            <p className="text-sm text-gray-600 mt-1">
              Document Type: <span className="font-medium">{result.documentType}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {result.confidence !== undefined && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Confidence</p>
              <p className="text-lg font-semibold text-gray-900">{(result.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(result.validationStatus)}`}>
            {result.validationStatus || 'COMPLETED'}
          </span>
        </div>
      </div>

      {result.issues && result.issues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Issues Found ({result.issues.length})</h3>
          <div className="space-y-2">
            {result.issues.map((issue, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-sm">{issue.field}</span>
                    <p className="text-sm mt-1">{issue.message}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    issue.severity === 'ERROR' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.extractedFields && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Fields</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.extractedFields).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 pb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm text-gray-900 mt-1 font-medium">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value, null, 2)
                      : String(value || 'N/A')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `validation-result-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Download JSON
        </button>
      </div>
    </div>
  );
}
