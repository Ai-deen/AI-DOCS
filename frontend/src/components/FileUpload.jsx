import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

export default function FileUpload({ onUpload, isUploading }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Uploading & extracting text...</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload size={40} className="text-blue-500" />
            <p className="text-blue-600 font-medium">Drop the file here</p>
          </>
        ) : (
          <>
            <FileText size={40} className="text-gray-400" />
            <p className="text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag & drop
            </p>
            <p className="text-sm text-gray-400">PDF, DOCX, TXT, MD, CSV, JSON (max 10MB)</p>
          </>
        )}
      </div>
    </div>
  );
}
