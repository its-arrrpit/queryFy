'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileUpload, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/plain' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      );
      
      if (validFiles.length > 0) {
        const fileList = new DataTransfer();
        validFiles.forEach(file => fileList.items.add(file));
        onFileUpload(fileList.files);
      }
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  }, [onFileUpload]);

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 transition-colors bg-white/10 backdrop-blur-sm border-white/30 shadow-lg ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-100 mx-auto" />
            )}
            
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isProcessing ? 'Processing Documents...' : 'Upload Documents'}
              </h3>
              <p className="text-gray-100 mb-4">
                {isProcessing 
                  ? 'Extracting questions and generating answers...'
                  : 'Drag and drop your PDF, Word, or TXT files here, or click to browse'
                }
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.doc"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  className="cursor-pointer"
                  disabled={isProcessing}
                  asChild
                >
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </label>
              
              <p className="my-4 text-xs text-gray-100">
                Supported formats: PDF, TXT (Max 10MB each)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>




    </div>
  );
}
