'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <Card className='bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'>
      <CardContent className="p-4 ">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-white" />
            <span className="text-lg font-bold text-white">Progress</span>
          </div>
          <span className="text-sm font-medium text-gray-100">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-700 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-100">
          Answer all questions to complete your assessment
        </div>
      </CardContent>
    </Card>
  );
}
