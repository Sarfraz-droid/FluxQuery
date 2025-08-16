import React from 'react'
import { Button } from '../ui/button'
import { useFixWithAI } from './useFixWithAI'

export const FixWithAI = () => {

    const { initiateFixWithAI } = useFixWithAI()

    return (
        <Button
        variant="secondary"
        size="md"
        className="gap-2"
        onClick={() => {
          initiateFixWithAI()
        }}
        aria-label="Fix with AI"
        title="Fix with AI"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M12 3l1.5 3 3 1.5-3 1.5L12 12l-1.5-3L7.5 7.5 10.5 6 12 3z"/>
          <path d="M6 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
          <path d="M16 14l.8 1.6L18.4 16l-1.6.8L16 18.4l-.8-1.6-1.6-.8 1.6-.8.8-1.6z"/>
        </svg>
        <span className="font-mono">Fix with AI</span>
      </Button>
  )
}
