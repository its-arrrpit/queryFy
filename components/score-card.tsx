'use client';

import { Question, Document } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, CheckCircle, XCircle } from 'lucide-react';
import { useState ,useEffect,useRef} from 'react';
interface ScoreCardProps {
  totalScore: number;
  questions: Question[];
  documents: Document[];
}

export function ScoreCard({ totalScore, questions, documents }: ScoreCardProps) {
  const correctAnswers = questions.filter(q => q.feedback === 'positive').length;
  const incorrectAnswers = questions.filter(q => q.feedback === 'negative').length;
  const unansweredQuestions = questions.filter(q => q.feedback === null).length;
  
  const maxPossibleScore = questions.reduce((total, question) => {
    const document = documents.find(d => d.id === question.documentId);
    return total + (document?.weight || 0) * question.weight;
  }, 0);

  const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // const vantaRef = useRef(null)
  // const [vantaEffect, setVantaEffect] = useState<any>(null)

  // useEffect(() => {
  //   if (!vantaEffect && typeof window !== 'undefined' && (window as any).VANTA) {
  //     const effect = (window as any).VANTA.WAVES({
  //       el: vantaRef.current,
  //       mouseControls: true,
  //       touchControls: true,
  //       minHeight: 200.0,
  //       minWidth: 200.0,
  //       scale: 1.0,
  //       scaleMobile: 1.0,
  //     })
  //     setVantaEffect(effect)
  //   }
  //   return () => {
  //     if (vantaEffect) vantaEffect.destroy()
  //   }
  // }, [vantaEffect])

  return (
    <div>
      <Card className='bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          Score Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg p-4 rounded-2xl">
          {/* Total Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(scorePercentage)}`}>
              {totalScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              out of {maxPossibleScore.toFixed(1)}
            </div>
            <Badge 
              variant="outline" 
              className={`mt-2 ${getScoreColor(scorePercentage)}`}
            >
              Grade: {getScoreGrade(scorePercentage)}
            </Badge>
          </div>

          {/* Percentage */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(scorePercentage)}`}>
              {scorePercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Accuracy
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  scorePercentage >= 80 ? 'bg-green-500' :
                  scorePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(scorePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Correct Answers */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {correctAnswers}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Correct Answers
            </div>
          </div>

          {/* Incorrect/Unanswered */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <span className="text-3xl font-bold text-red-600">
                {incorrectAnswers}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Incorrect Answers
            </div>
            {unansweredQuestions > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ({unansweredQuestions} unanswered)
              </div>
            )}
          </div>
        </div>

        {/* Document Breakdown */}
        {documents.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Score Breakdown by Document</h4>
            <div className="space-y-2">
              {documents.map(doc => {
                const docQuestions = questions.filter(q => q.documentId === doc.id);
                const docScore = docQuestions.reduce((score, q) => {
                  return q.feedback === 'positive' ? score + (doc.weight * q.weight) : score;
                }, 0);
                const docMaxScore = docQuestions.reduce((max, q) => max + (doc.weight * q.weight), 0);
                
                return (
                  <div key={doc.id} className="bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant={doc.type === 'known' ? 'secondary' : 'default'}>
                        {doc.type}
                      </Badge>
                      <span className="font-medium truncate">{doc.name}</span>
                      <span className="text-sm text-gray-500">
                        ({docQuestions.length} questions)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {docScore.toFixed(1)} / {docMaxScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {docMaxScore > 0 ? Math.round((docScore / docMaxScore) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
