'use client';

import { Question } from '@/app/page';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, FileText, Loader2, Brain } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onFeedback: (questionId: string, feedback: 'positive' | 'negative') => void;
}

export function QuestionCard({ question, index, onFeedback }: QuestionCardProps) {
  return (
    <Card className={`transition-all duration-200 bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg ${
      question.feedback === 'positive' 
        ? 'border-green-200 bg-green-50' 
        : question.feedback === 'negative'
        ? 'border-red-200 bg-red-50'
        : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3 ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Q{index}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <FileText className="h-3 w-3" />
                {question.documentName}
              </div>
              <Badge variant="secondary" className="text-xs">
                Weight: {question.weight}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {question.text}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 ">
        <div className="space-y-4">
          {/* Answer Section */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI Answer</span>
              {question.isGenerating && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            
            {question.isGenerating ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-pulse">Generating answer...</div>
              </div>
            ) : (
              <p className="text-gray-800 leading-relaxed">
                {question.answer || 'No answer generated yet.'}
              </p>
            )}
          </div>

          {/* Feedback Section */}
          {!question.isGenerating && question.answer && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Is this answer correct?
                </span>
                {question.feedback && (
                  <Badge 
                    variant={question.feedback === 'positive' ? 'default' : 'destructive'}
                    className="text-xs text-white"
                  >
                    {question.feedback === 'positive' ? 'Correct' : 'Incorrect'}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={question.feedback === 'positive' ? 'default' : 'outline'}
                  onClick={() => onFeedback(question.id, 'positive')}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Correct
                </Button>
                <Button
                  size="sm"
                  variant={question.feedback === 'negative' ? 'destructive' : 'outline'}
                  onClick={() => onFeedback(question.id, 'negative')}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Incorrect
                </Button>
              </div>
            </div>
          )}

          {/* Score Preview */}
          {question.feedback === 'positive' && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-800 font-medium">Score Contribution:</span>
                <span className="text-green-900 font-bold">
                  +{(question.weight * 2.0).toFixed(1)} points
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
