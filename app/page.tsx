'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/file-upload';
import { DocumentList } from '@/components/document-list';
import { QuestionList } from '@/components/question-list';
import { ScoreCard } from '@/components/score-card';
import { ProgressBar } from '@/components/progress-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Target, Upload } from 'lucide-react';

import { useQueryFy } from '@/hooks/useQueryFy';
import { checkBackendHealth } from '@/lib/api';
import { buildApiUrl, API_CONFIG } from '@/lib/config';
import { Document, Question } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function QAPlatform() {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'error' | 'checking'>('checking');
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'unanswered'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [categoryRatings, setCategoryRatings] = useState({
    accuracy: 0,
    efficacy: 0,
    userFriendly: 0,
    relevance: 0,
  });
  type CategoryRatingsType = { accuracy: number; efficacy: number; userFriendly: number; relevance: number };
  const [ratingsByQuestion, setRatingsByQuestion] = useState<Record<string, CategoryRatingsType>>({});
  const queryInputRef = useRef<HTMLTextAreaElement>(null);
  const isLikelyProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const {
    documents,
    questions,
    isProcessing,
    backendDocuments,
    handleFileUpload,
    handleCustomQuery,
    handleDeleteDocument,
    updateQuestionFeedback,
    clearAllDocuments,
  } = useQueryFy();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkBackendHealth();
        setBackendStatus(health.status);
      } catch (error) {
        setBackendStatus('error');
      }
    };
    checkHealth();
  }, []);

  useEffect(() => {
    setSelectedDocumentId('');
    setDynamicQuestions([]);
    setCurrentRating(null);
    setTotalScore(0);
    setRatingCount(0);
  // ratings are tracked per-question; no global reset needed here
    // Do not auto-load documents on page load; show only session uploads
  }, []);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && typeof window !== 'undefined' && (window as any).VANTA) {
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
        zoom: 0.65,
      });
      setVantaEffect(effect);
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const handleManualFileUpload = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
  }, []);

  const handleUpload = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      const dt = new DataTransfer();
      uploadedFiles.forEach(file => dt.items.add(file));
      await handleFileUpload(dt.files);
      setUploadedFiles([]);
      // Newly uploaded files are already reflected in local state
      toast({
        title: 'Upload Successful',
        description: 'Your document(s) have been uploaded successfully!',
      });
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('empty') || error.message.includes('no readable text')) {
          errorMessage = 'The uploaded file is empty or unreadable. Please try another file.';
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadedFiles, handleFileUpload]);

  // Fetch/generate dynamic questions whenever documents change (after upload)
  useEffect(() => {
    if (documents.length > 0) {
      const lastDoc = documents[documents.length - 1];
      setSelectedDocumentId(lastDoc.id);
      (async () => {
        try {
          const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.RECOMMENDED_QUESTIONS(lastDoc.id)));
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.questions) && data.questions.length > 0) {
              setDynamicQuestions(data.questions);
              console.log('Dynamic questions from backend:', data.questions);
            } else {
              const fallback = [
                `What is the main topic of ${lastDoc.name}?`,
                `Summarize the key points in ${lastDoc.name}.`,
                `What are the most important facts in ${lastDoc.name}?`
              ];
              setDynamicQuestions(fallback);
              console.log('Backend returned empty, using fallback:', fallback);
            }
          } else {
            const fallback = [
              `What is the main topic of ${lastDoc.name}?`,
              `Summarize the key points in ${lastDoc.name}.`,
              `What are the most important facts in ${lastDoc.name}?`
            ];
            setDynamicQuestions(fallback);
            console.log('Backend error, using fallback:', fallback);
          }
        } catch (err) {
          const fallback = [
            `What is the main topic of ${lastDoc.name}?`,
            `Summarize the key points in ${lastDoc.name}.`,
            `What are the most important facts in ${lastDoc.name}?`
          ];
          setDynamicQuestions(fallback);
          console.log('Exception fetching questions, using fallback:', fallback, err);
        }
      })();
    } else {
      setDynamicQuestions([]);
    }
  }, [documents]);

  // Query handler - separate from upload
  const handleQuerySubmit = useCallback(async () => {
    if (!selectedDocumentId || !userQuery.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a document and enter a question.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
  // Processing AI query
      // Find the document name from documents
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const documentName = selectedDoc?.name || 'Unknown Document';
      // Process the query using the hook method
      const answer = await handleCustomQuery(selectedDocumentId, userQuery, documentName);
      if (answer) {
        toast({
          title: 'Query Successful',
          description: 'AI answer received!',
        });
  // AI answer received
      } else {
        toast({
          title: 'No Answer Returned',
          description: 'AI query completed but no answer was returned.',
          variant: 'destructive',
        });
        // No answer returned
      }
      setUserQuery('');
      // Query completed
    } catch (error) {
      console.error('❌ Query error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Query Error',
        description: `${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDocumentId, userQuery, documents, handleCustomQuery]);

  const handleFeedback = useCallback((questionId: string, feedback: 'positive' | 'negative') => {
    updateQuestionFeedback(questionId, feedback);
  }, [updateQuestionFeedback]);

  const handleCategoryRating = useCallback((questionId: string, category: keyof CategoryRatingsType, rating: number) => {
    setRatingsByQuestion(prev => {
      const current = prev[questionId] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
      const updated = { ...current, [category]: rating } as CategoryRatingsType;
      // Compute average
      const totalCategoryScore = Object.values(updated).reduce((sum, val) => sum + val, 0);
      const averageScore = totalCategoryScore / 4;
      setCurrentRating(Math.round(averageScore));
      setTotalScore(s => s + averageScore);
      setRatingCount(c => c + 1);
      // Persist overall rating into the question object and feedback signal
      updateQuestionFeedback(questionId, averageScore > 6 ? 'positive' : 'negative');
      return { ...prev, [questionId]: updated };
    });
  }, [updateQuestionFeedback]);

  const clearAll = useCallback(async () => {
    // Clear all documents in backend and reset local session state
    await clearAllDocuments();
    setUploadedFiles([]);
    setUserQuery('');
  }, [clearAllDocuments]);





  const calculateTotalScore = useCallback(() => {
    return questions.reduce((total, question) => {
      if (question.feedback === 'positive') {
        const document = documents.find(d => d.id === question.documentId);
        return total + (document?.weight || 0) * question.weight;
      }
      return total;
    }, 0);
  }, [questions, documents]);

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

  const getProgress = useCallback(() => {
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => q.feedback !== null).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }, [questions]);

  const resetPlatform = useCallback(() => {
    clearAll();
    setFilter('all');
  }, [clearAll]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        <div className="min-h-full p-4">
          <div className="relative max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8 animate-fade-in-down hover:bg-white/15 transition-all duration-500">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-3 sm:gap-4 animate-pulse">
            <Brain className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-cyan-400 animate-bounce" />
            QueryFy
          </h1>
          <p className="text-slate-200 font-medium text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            🚀 Upload documents to extract questions and get AI-powered answers with intelligent scoring
          </p>
          {/* Runtime debug banner to help detect misconfiguration in production */}
          {(backendStatus !== 'healthy' || (isLikelyProd && API_CONFIG.BASE_URL.includes('localhost'))) && (
            <div className="mt-3 text-sm px-3 py-2 inline-block rounded-md border border-yellow-400/50 bg-yellow-500/20 text-yellow-100">
              <span className="font-semibold">Backend:</span> {backendStatus.toUpperCase()} •
              <span className="ml-2 font-mono">{API_CONFIG.BASE_URL}</span>
              {isLikelyProd && API_CONFIG.BASE_URL.includes('localhost') && (
                <span className="ml-2">(warning: using localhost in production)</span>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up">
          <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/30 group'>
    <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors duration-300">
      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
      <p className="text-base sm:text-lg font-semibold text-slate-200 group-hover:text-white transition-colors duration-300">Documents</p>
      <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/20'>
    <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-300" />
                </div>
                <div>
      <p className="text-base sm:text-lg font-semibold text-slate-200">Questions</p>
      <p className="text-2xl sm:text-3xl font-bold text-white">{questions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-green-500/20'>
    <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <div className="h-8 w-8 rounded-full border-4 border-green-300 border-t-transparent animate-spin-slow"></div>
                </div>
                <div>
      <p className="text-base sm:text-lg font-semibold text-slate-200">Progress</p>
      <p className="text-2xl sm:text-3xl font-bold text-white">{Math.round(getProgress())}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/20'>
    <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <span className="text-2xl animate-bounce">⭐</span>
                  </div>
                </div>
                <div>
      <p className="text-base sm:text-lg font-semibold text-slate-200">Overall Score</p>
      <p className="text-2xl sm:text-3xl font-bold text-white">
                    {(() => {
                      const activeQ = questions[questions.length - 1];
                      const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                      const vals = Object.values(r);
                      return (vals.some(v => v > 0) ? (vals.reduce((a,b)=>a+b,0)/4).toFixed(1) : '0.0') + '/10';
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {questions.length > 0 && (
          <ProgressBar progress={getProgress()} />
        )}

        {/* File Upload and Query */}
        <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 animate-slide-up group'>
          <CardHeader className=" border-b border-white/10 group-hover:from-blue-500/15 group-hover:to-purple-500/15 transition-all duration-300">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 group-hover:text-blue-300 transition-colors duration-300">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
              </div>
              📤 Upload Documents & Ask Questions
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* File Upload */}
            <FileUpload
              onFileUpload={handleManualFileUpload}
              isProcessing={isSubmitting}
            />
            {/* Show uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-200 font-medium mb-2">📁 Files Ready:</p>
                {uploadedFiles.map((file, index) => (
                  <p key={index} className="text-green-100 text-sm break-words">• {file.name}</p>
                ))}
              </div>
            )}
            {/* Query Input */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm sm:text-base" htmlFor="user-query">Your Question:</label>
              <textarea
                id="user-query"
                ref={queryInputRef}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask a question about your document... (e.g., 'What is the main topic?', 'Summarize the key points')"
                className="w-full p-3 sm:p-4 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 resize-none"
                rows={3}
                disabled={isSubmitting}
                aria-label="Your Question"
                aria-required="true"
              />
            </div>
            {/* Upload Button - appears when files are selected */}
            {uploadedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mb-4"
                aria-label="Upload Document"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                    Upload Document
                  </>
                )}
              </Button>
            )}
            {/* Document Selector - appears after upload */}
            {documents.length > 0 && (
        <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2" htmlFor="document-select">
                  📄 Select Document to Query:
                </label>
                <select
                  id="document-select"
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
          className="w-full p-3 sm:p-4 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white"
                  aria-label="Select Document to Query"
                  aria-required="true"
                >
                  <option value="" className="text-gray-800">Choose a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="text-gray-800">
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Query Submit Button - appears when document is selected and query is entered */}
            {selectedDocumentId && userQuery.trim() && (
              <Button
                onClick={handleQuerySubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                aria-label="Ask Question"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Processing Query...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
                    Ask Question
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Answer Display Card */}
        {questions.length > 0 && questions[questions.length - 1]?.answer && (
          <Card className='bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-300 animate-slide-up group'>
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-white/10 group-hover:from-green-500/15 group-hover:to-blue-500/15 transition-all duration-300">
              <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 group-hover:text-green-300 transition-colors duration-300">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 animate-pulse" />
                </div>
                🤖 AI Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 bg-blue-500/15 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors duration-300">
                <p className="text-blue-200 font-semibold mb-3 text-lg">📝 Your Question:</p>
                <p className="text-white text-base leading-relaxed">{questions[questions.length - 1]?.text}</p>
              </div>
              
              <div className="p-5 bg-green-500/15 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors duration-300">
                <p className="text-green-200 font-semibold mb-3 text-lg">🤖 AI Answer:</p>
                <p className="text-white text-base leading-relaxed">{questions[questions.length - 1]?.answer}</p>
              </div>
              
              {/* Multi-Category Rating System */}
              <div className="space-y-4 pt-2">
                <p className="text-white font-medium text-center">⭐ Rate this answer on multiple criteria:</p>
                
                {/* Rating Categories */}
                <div className="space-y-4">
                  {(() => { return null })()}
                  {[
                    { key: 'accuracy' as const, label: '🎯 Accuracy', desc: 'How correct is the information?' },
                    { key: 'efficacy' as const, label: '⚡ Efficacy', desc: 'How well does it solve your question?' },
                    { key: 'userFriendly' as const, label: '👤 User Friendly', desc: 'How easy to understand?' },
                    { key: 'relevance' as const, label: '🔍 Relevance', desc: 'How relevant to your query?' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-300 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-white font-semibold text-base">{label}</p>
                          <p className="text-slate-300 text-sm">{desc}</p>
                        </div>
                        <span className="text-yellow-400 font-bold text-lg">
                          {(() => {
                            const activeQ = questions[questions.length - 1];
                            const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                            return r[key] > 0 ? `${r[key]}/10` : '-';
                          })()}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <Button
                            key={rating}
                            onClick={() => handleCategoryRating(questions[questions.length - 1]?.id, key, rating)}
                            variant="outline"
                            size="sm"
                            className={`w-8 h-8 p-0 text-sm font-bold transition-all duration-300 ${
                              (() => {
                                const activeQ = questions[questions.length - 1];
                                const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                                return r[key] === rating;
                              })()
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 scale-110 shadow-lg shadow-yellow-500/50'
                                : 'bg-white/10 hover:bg-yellow-500/70 text-white border-white/30 hover:scale-105 hover:shadow-md'
                            }`}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Overall Score Display */}
                {(() => {
                  const activeQ = questions[questions.length - 1];
                  const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                  return Object.values(r).some(v => v > 0);
                })() && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-5 hover:from-yellow-500/25 hover:to-orange-500/25 transition-all duration-300 shadow-lg">
                    <p className="text-yellow-100 font-bold text-center mb-4 text-xl">
                      {(() => {
                        const activeQ = questions[questions.length - 1];
                        const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                        return `📊 Overall Score: ${(Object.values(r).reduce((s, v) => s + v, 0) / 4).toFixed(1)}/10`;
                      })()}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {(() => {
                        const activeQ = questions[questions.length - 1];
                        const r = activeQ ? (ratingsByQuestion[activeQ.id] ?? { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 }) : { accuracy: 0, efficacy: 0, userFriendly: 0, relevance: 0 };
                        return (
                          <>
                            <div className="text-yellow-200 font-medium bg-white/5 rounded-lg p-2">🎯 Accuracy: {r.accuracy}/10</div>
                            <div className="text-yellow-200 font-medium bg-white/5 rounded-lg p-2">⚡ Efficacy: {r.efficacy}/10</div>
                            <div className="text-yellow-200 font-medium bg-white/5 rounded-lg p-2">👤 User Friendly: {r.userFriendly}/10</div>
                            <div className="text-yellow-200 font-medium bg-white/5 rounded-lg p-2">🔍 Relevance: {r.relevance}/10</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Type Guide (moved below query) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-2 transition-colors bg-white/10 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <h4 className="font-bold text-green-300 mb-2 text-base sm:text-lg">📚 Known Documents</h4>
              <p className="text-xs sm:text-sm font-semibold text-green-200">
                Documents with "known" in filename get lower weight (0.5x) - ideal for basic knowledge testing
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 transition-colors bg-white/10 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <h4 className="font-bold text-blue-300 mb-2 text-base sm:text-lg">🔍 Unknown Documents</h4>
              <p className="text-xs sm:text-sm font-semibold text-blue-200">
                Other documents get higher weight (2.0x) - perfect for challenging or specialized content
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <DocumentList
          documents={documents}
          onDeleteDocument={handleDeleteDocument}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
        />


        {/* Recommended Questions */}
        {documents.length > 0 && (
          <Card className='bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                💡 Recommended Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-300 text-sm mb-4">
                Try asking these sample questions about your uploaded documents:
              </p>
              
              <div className="space-y-3">
                {dynamicQuestions.length > 0 && dynamicQuestions.map((question, index) => {
                  const colors = [
                    'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30 text-purple-100',
                    'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30 text-orange-100',
                    'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-100',
                    'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30 text-pink-100',
                    'bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-100'
                  ];
                  const colorClass = colors[index % colors.length];
                  const icons = ['📋', '📝', '🔍', '💡', '🎯'];
                  const icon = icons[index % icons.length];
                  return (
                    <div 
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${colorClass}`}
                      onClick={() => {
                        setUserQuery(question);
                        setTimeout(() => {
                          queryInputRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest'
                          });
                          setTimeout(() => {
                            queryInputRef.current?.focus();
                          }, 300);
                        }, 100);
                      }}
                    >
                      <p className="font-medium">{icon} {question}</p>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-gray-400 text-xs mt-4">
                💡 Click any question above to auto-fill it in your query box, then hit Submit!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Score Card */}
        {/* {questions.length > 0 && (
          <Card className='bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                📊 Your Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-white">
                  {calculateTotalScore().toFixed(1)}
                </div>
                <p className="text-gray-300">
                  Based on {questions.filter(q => q.feedback === 'positive').length} likes 
                  and {questions.filter(q => q.feedback === 'negative').length} dislikes
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">
                      {questions.filter(q => q.feedback === 'positive').length}
                    </div>
                    <div className="text-green-300 text-sm">👍 Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-xl">
                      {questions.filter(q => q.feedback === 'negative').length}
                    </div>
                    <div className="text-red-300 text-sm">👎 Dislikes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Empty State */}
        {documents.length === 0 && (
          <Card className="border-2 transition-colors bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900/80 backdrop-blur-sm border-blue-400/40 shadow-2xl">
            <CardContent className="p-6 sm:p-10 text-center ">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-300 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg sm:text-xl font-semibold text-blue-200 mb-5">
                No documents uploaded yet
              </h3>
              <p className="text-sm sm:text-base font-medium text-cyan-200 drop-shadow mb-4">
                Upload PDF or TXT files to get started with question extraction and AI-powered answers
              </p>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
