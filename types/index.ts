export interface Document {
  id: string;
  name: string;
  type: 'known' | 'unknown';
  weight: number;
  uploadedAt: Date;
}

export interface Question {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  answer: string;
  weight: number;
  feedback: 'positive' | 'negative' | null;
  rating?: number; // 1-10 rating scale
  isGenerating: boolean;
}
