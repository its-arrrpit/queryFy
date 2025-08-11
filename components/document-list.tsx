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
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Uploaded Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedDocumentId === doc.id
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => onSelectDocument(doc.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-300" />
                <div>
                  <p className="text-white font-medium">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {doc.type}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
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
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
