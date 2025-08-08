'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

type Filter = 'all' | 'positive' | 'negative' | 'unanswered'

interface FilterButtonsProps {
  filter: Filter
  setFilter: (filter: Filter) => void
}

export function FilterButtons({ filter, setFilter }: FilterButtonsProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => setFilter('all')}
      >
        All
      </Button>
      <Button
        variant={filter === 'positive' ? 'default' : 'outline'}
        onClick={() => setFilter('positive')}
      >
        Positive
      </Button>
      <Button
        variant={filter === 'negative' ? 'default' : 'outline'}
        onClick={() => setFilter('negative')}
      >
        Negative
      </Button>
      <Button
        variant={filter === 'unanswered' ? 'default' : 'outline'}
        onClick={() => setFilter('unanswered')}
      >
        Unanswered
      </Button>
    </div>
  )
}