// Simple Gemini API client wrapper
// Reads API key from environment: REACT_APP_GEMINI_API_KEY
// Provides getStudySuggestion(contextObject)
// The contextObject should include: student, weaknesses, plan (allocations), day, hourNow
// NOTE: In production you should proxy this through a backend to avoid exposing the key.

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash'; // can be adjusted to a different available model

function buildPrompt({ student, weaknesses, plan, day, hourNow }) {
  const studentLine = student ? `${student.name} (major: ${student.major || 'N/A'}, GPA ${student.gpa || 'N/A'})` : 'Unknown student';
  const weakLines = (weaknesses || []).map(w => {
    const mastery = (1 + (w.mastery||0)*9).toFixed(1);
    return `- ${w.concept?.name || w.concept_id}: mastery ${mastery}/10`;
  }).join('\n');
  const planLines = (plan?.allocations || []).map(a => {
    return `* ${a.name}: ${a.minutes} minutes → projected ${(1 + a.projected*9).toFixed(1)}/10 (was ${(1 + a.current*9).toFixed(1)}/10)`;
  }).join('\n');
  return `You are an academic study planning assistant. Given the student profile, current weakest concepts, and a time allocation plan, write a concise, motivating next-steps study suggestion. Use numbered steps (<=6), include one brief motivational sentence, and cite concrete time blocks.

Current Day/Time: ${day} ${String(hourNow).padStart(2,'0')}:00
Student: ${studentLine}
Weak Concepts:\n${weakLines || '(none)'}
Planned Allocations:\n${planLines || '(none)'}

Respond in under 180 words.`;
}

export async function getStudySuggestion(context){
  if(!API_KEY){
    throw new Error('Missing REACT_APP_GEMINI_API_KEY environment variable');
  }
  const prompt = buildPrompt(context || {});
    throw new Error('Gemini client deprecated. Import from ../ai/groqClient');
  }
  // Gemini client removed. Use groqClient instead.

export { buildPrompt }; // export for testing
