import React, { useState, useRef } from 'react';
import { ValidationResult } from './ValidationResult';

interface UploadState {
  uploading: boolean;
  error: string | null;
  results: any[];
  currentFile: number;
  totalFiles: number;
}

export function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    results: [],
    currentFile: 0,
    totalFiles: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setState({ uploading: false, error: null, results: [], currentFile: 0, totalFiles: 0 });
    } else {
      setState({ uploading: false, error: "Please upload PDF files only", results: [], currentFile: 0, totalFiles: 0 });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => f.type === "application/pdf");
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setState({ uploading: false, error: null, results: [], currentFile: 0, totalFiles: 0 });
    } else {
      setState({ uploading: false, error: "Please upload PDF files only", results: [], currentFile: 0, totalFiles: 0 });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setState({ uploading: true, error: null, results: [], currentFile: 0, totalFiles: files.length });

    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setState(prev => ({ ...prev, currentFile: i + 1 }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/.netlify/functions/validate-document', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        
        if (!text) {
          throw new Error('Empty response from server');
        }

        const data = JSON.parse(text);

        if (data.success) {
          results.push({
            fileName: file.name,
            status: 'success',
            result: data.result
          });
        } else {
          results.push({
            fileName: file.name,
            status: 'error',
            error: data.error || 'Validation failed'
          });
        }
      } catch (error: any) {
        results.push({
          fileName: file.name,
          status: 'error',
          error: error.message || 'Upload failed'
        });
      }
    }

    setState({ uploading: false, error: null, results, currentFile: 0, totalFiles: 0 });
  };

  const handleReset = () => {
    setFiles([]);
    setState({ uploading: false, error: null, results: [], currentFile: 0, totalFiles: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Navia Document Validator
        </h1>
        <p className="text-gray-600 mb-6">
          Upload multiple shipping documents for AI-powered validation
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {files.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{files.length} file(s) selected</p>
              <p className="text-xs text-gray-500 mt-1">
                {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">
                Click to upload
              </label>
              <span className="text-gray-600"> or drag and drop</span>
              <p className="text-xs text-gray-500 mt-1">PDF files only • Multiple files supported</p>
            </div>
          )}
        </div>

        {state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-gray-700 mb-2">Selected Files:</p>
            <div className="space-y-1">
              {files.map((file, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="truncate">{file.name}</span>
                  <span className="text-gray-400 ml-2">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || state.uploading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              files.length > 0 && !state.uploading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {state.uploading 
              ? `Validating ${state.currentFile}/${state.totalFiles}...` 
              : `Validate ${files.length} Document${files.length !== 1 ? 's' : ''}`}
          </button>

          {(files.length > 0 || state.results.length > 0) && (
            <button
              onClick={handleReset}
              disabled={state.uploading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {state.results.length > 0 && (
        <div className="mt-6 space-y-4">
          {state.results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{result.fileName}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              {result.status === 'success' ? (
                <ValidationResult result={result.result} />
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
