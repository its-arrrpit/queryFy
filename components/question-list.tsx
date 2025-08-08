'use client';

import { Question } from '@/app/page';
import { QuestionCard } from '@/components/question-card';

interface QuestionListProps {
  questions: Question[];
  onFeedback: (questionId: string, feedback: 'positive' | 'negative') => void;
}

export function QuestionList({ questions, onFeedback }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No questions match the current filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Questions & Answers ({questions.length})
      </h2>
      
      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index + 1}
            onFeedback={onFeedback}
          />
        ))}
      </div>
    </div>
  );
}
