'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/file-upload';
import { QuestionList } from '@/components/question-list';
import { ScoreCard } from '@/components/score-card';
import { ProgressBar } from '@/components/progress-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useQueryFy } from '@/hooks/useQueryFy';
import { checkBackendHealth } from '@/lib/api';

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
  isGenerating: boolean;
}

export default function QAPlatform() {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'unanswered'>('all');

  // Use QueryFy backend integration
  const {
    documents,
    questions,
    isProcessing,
    handleFileUpload,
    handleCustomQuery,
    handleDeleteDocument,
    updateQuestionFeedback,
    loadDocuments
  } = useQueryFy();

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkBackendHealth();
      setBackendConnected(isConnected);
      if (!isConnected) {
  console.warn('QueryFy backend is not available. Please ensure the backend server is running on https://queryfy-backend.onrender.com');
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    if (!vantaEffect && typeof window !== 'undefined' && (window as any).VANTA) {
      const effect = (window as any).VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x23153c,
        shininess: 30.0,
        waveHeight: 15.0,
        waveSpeed: 1.0,
        zoom: 0.65
      });
      setVantaEffect(effect);
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const handleFeedback = useCallback((questionId: string, feedback: 'positive' | 'negative') => {
    updateQuestionFeedback(questionId, feedback);
  }, [updateQuestionFeedback]);

  const clearAll = useCallback(() => {
    // Clear all documents and questions by reloading
    loadDocuments();
  }, [loadDocuments]);

  const calculateTotalScore = useCallback(() => {
    return questions.reduce((total, question) => {
      if (question.feedback === 'positive') {
        return total + question.weight;
      } else if (question.feedback === 'negative') {
        return total - question.weight;
      }
      return total;
    }, 0);
  }, [questions]);

  const getFilteredQuestions = useCallback(() => {
    switch (filter) {
      case 'positive':
        return questions.filter(q => q.feedback === 'positive');
      case 'negative':
        return questions.filter(q => q.feedback === 'negative');
      case 'unanswered':
        return questions.filter(q => q.feedback === null);
      default:
        return questions;
    }
  }, [questions, filter]);

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div ref={vantaRef} className="absolute inset-0 opacity-30" />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              QueryFy AI Platform
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Upload documents and get intelligent answers powered by Google Gemini AI
            </p>
            
            {/* Backend Status Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {backendConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400">Backend Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">Backend Disconnected</span>
                </>
              )}
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <Badge variant="secondary" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {documents.length} Documents
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                {questions.length} Questions
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Score: {calculateTotalScore().toFixed(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload 
                    onFileUpload={handleFileUpload} 
                    isProcessing={isProcessing} 
                  />
                  {!backendConnected && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm">
                        ⚠️ Backend not connected. Please start the QueryFy backend server.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI-Generated Questions & Answers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="text-xs"
                    >
                      All ({questions.length})
                    </Button>
                    <Button
                      variant={filter === 'positive' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('positive')}
                      className="text-xs"
                    >
                      Positive ({questions.filter(q => q.feedback === 'positive').length})
                    </Button>
                    <Button
                      variant={filter === 'negative' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('negative')}
                      className="text-xs"
                    >
                      Negative ({questions.filter(q => q.feedback === 'negative').length})
                    </Button>
                    <Button
                      variant={filter === 'unanswered' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unanswered')}
                      className="text-xs"
                    >
                      Unanswered ({questions.filter(q => q.feedback === null).length})
                    </Button>
                  </div>
                  
                  <QuestionList
                    questions={filteredQuestions}
                    onFeedback={handleFeedback}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <ScoreCard
                documents={documents}
                questions={questions}
                totalScore={calculateTotalScore()}
              />

              <ProgressBar
                documents={documents}
                questions={questions}
                isProcessing={isProcessing}
              />

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={clearAll}
                    variant="outline"
                    className="w-full"
                    disabled={documents.length === 0}
                  >
                    Clear All Documents
                  </Button>
                  <Button
                    onClick={loadDocuments}
                    variant="outline"
                    className="w-full"
                  >
                    Refresh Documents
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
