'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Calendar } from 'lucide-react';
import { Document } from '@/types';

interface DocumentListProps {
  documents: Document[];
  onDeleteDocument: (documentId: string) => void;
  selectedDocumentId: string;
  onSelectDocument: (documentId: string) => void;
}

export function DocumentList({ 
  documents, 
  onDeleteDocument, 
  selectedDocumentId, 
  onSelectDocument 
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border border-white/20">
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">No documents uploaded yet</p>
          <p className="text-sm text-gray-400 mt-2">Upload a document to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">Uploaded Documents ({documents.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
              selectedDocumentId === doc.id
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => onSelectDocument(doc.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium break-words sm:truncate" title={doc.name}>{doc.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {doc.type}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {doc.uploadedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
