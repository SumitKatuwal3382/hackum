import React, { useState, useCallback } from 'react';
import { getStudySuggestion } from '../ai/groqClient';
import Badge from './Badge';

// Utility: format weakness objects similarly to AIPlanner usage
function mapWeaknesses(raw){
  return (raw||[]).map(w => ({
    concept_id: w.concept_id,
    mastery: w.mastery,
    concept: w.concept
  }));
}

export default function StudySuggestion({ student, weaknesses, planContext, day, hourNow }){
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState('');

  const handleClick = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const text = await getStudySuggestion({
        student,
        weaknesses: mapWeaknesses(weaknesses),
        plan: planContext?.plan,
        day,
        hourNow
      });
      setSuggestion(text);
    } catch(e){
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [student, weaknesses, planContext, day, hourNow]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleClick}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >{loading ? 'Generating...' : 'Get AI Suggestion'}</button>
        {suggestion && !loading && <Badge>Done</Badge>}
        {!process.env.REACT_APP_GROQ_API_KEY && (
          <span className="text-xs text-red-600">Groq API key missing (.env.local)</span>
        )}
      </div>
      {error && <div className="p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-700 whitespace-pre-wrap">{error}</div>}
      {suggestion && !error && (
        <div className="p-4 rounded-md bg-black text-white text-sm whitespace-pre-wrap leading-snug border border-gray-700 shadow-inner font-mono">
          {suggestion}
        </div>
      )}
      {!suggestion && !loading && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">Click to generate a concise AI-guided next-steps study plan using Groq (LLaMA model).</p>
      )}
      <p className="text-[10px] text-gray-400">Prototype – do not include private data. Suggestions may be imperfect.</p>
    </div>
  );
}
