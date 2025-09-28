// Groq Cloud client for study suggestions
// Uses OpenAI-compatible Chat Completions endpoint
// Env var: REACT_APP_GROQ_API_KEY
// NOTE: Exposing API key in frontend is insecure for production; proxy server recommended.

const API_KEY = process.env.REACT_APP_GROQ_API_KEY;
// Allow override: REACT_APP_GROQ_MODEL; fallback list ordered by capability/perf tradeoff.
const FALLBACK_MODELS = [
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768'
];
const PRIMARY_MODEL = process.env.REACT_APP_GROQ_MODEL || FALLBACK_MODELS[0];

export function buildPrompt({ student, weaknesses, plan, day, hourNow }) {
  const studentLine = student ? `${student.name} (major: ${student.major || 'N/A'}, GPA ${student.gpa || 'N/A'})` : 'Unknown student';
  const weakLines = (weaknesses || []).map(w => {
    const mastery = (1 + (w.mastery||0)*9).toFixed(1);
    return `- ${w.concept?.name || w.concept_id}: mastery ${mastery}/10`;
  }).join('\n');
  const planLines = (plan?.allocations || []).map(a => `* ${a.name}: ${a.minutes}m → projected ${(1 + a.projected*9).toFixed(1)}/10 (was ${(1 + a.current*9).toFixed(1)}/10)`).join('\n');
  return `You are an academic study planning assistant. Given the student profile, current weakest concepts, and a time allocation plan, write a concise, motivating next-steps study suggestion. Use numbered steps (<=6), include one brief motivational sentence, and cite concrete time blocks. Keep under 170 words.
Current Day/Time: ${day} ${String(hourNow).padStart(2,'0')}:00
Student: ${studentLine}
Weak Concepts:\n${weakLines || '(none)'}
Planned Allocations:\n${planLines || '(none)'}\n`;}

async function callGroq(model, prompt){
  const body = {
    model,
    messages: [
      { role: 'system', content: 'You create focused, structured study improvement suggestions.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 500,
  };
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if(!res.ok){
    // Try to parse error JSON
    let parsed;
    try { parsed = JSON.parse(text); } catch { /* noop */ }
    const code = parsed?.error?.code;
    const message = parsed?.error?.message || text;
    return { ok:false, code, message, status: res.status };
  }
  let data;
  try { data = JSON.parse(text); } catch { return { ok:false, code:'parse_error', message:'Invalid JSON from Groq', status: res.status }; }
  const choice = data.choices && data.choices[0];
  const output = choice?.message?.content?.trim() || '[No suggestion returned]';
  return { ok:true, output };
}

export async function getStudySuggestion(context){
  if(!API_KEY){
    throw new Error('Missing REACT_APP_GROQ_API_KEY environment variable');
  }
  const prompt = buildPrompt(context || {});
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m=> m !== PRIMARY_MODEL)];
  const errors = [];
  for(const m of modelsToTry){
    const result = await callGroq(m, prompt);
    if(result.ok){
      return result.output + (m!==modelsToTry[0] ? `\n\n(Model fallback used: ${m})` : '');
    }
    errors.push(`${m}: ${result.status} ${result.code || ''} ${result.message}`);
    // If model decommissioned or not found, continue; other errors break
    if(!(result.code === 'model_decommissioned' || result.code === 'model_not_found')){
      break;
    }
  }
  // All static attempts failed. Try dynamic discovery if failures were only decommission/not_found.
  if(errors.length && errors.every(e => /model_decommissioned|model_not_found/.test(e))){
    try {
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if(modelsRes.ok){
        const list = await modelsRes.json();
        const names = (list.data || []).map(m=> m.id);
        // Prefer newer llama3.* large then smaller, then anything containing 'llama' or 'mixtral'.
        const preferred = names
          .filter(n => /llama|mixtral/i.test(n))
          .sort((a,b)=> {
            // heuristic: longer id with bigger parameter count first
            const weight = (id)=> (/70b|405b/i.test(id)?3: /8x7b|8b/i.test(id)?2:1) + (id.includes('instruct')?0.2:0);
            return weight(b) - weight(a);
          });
        for(const dyn of preferred){
          if(modelsToTry.includes(dyn)) continue; // already tried
          const result = await callGroq(dyn, prompt);
          if(result.ok){
            return result.output + `\n\n(Model auto-discovered: ${dyn})`;
          }
          errors.push(`${dyn}: ${result.status} ${result.code || ''} ${result.message}`);
          if(!(result.code === 'model_decommissioned' || result.code === 'model_not_found')){
            break;
          }
        }
      } else {
        errors.push('model_list: ' + modelsRes.status + ' failed to fetch models');
      }
    } catch(e){
      errors.push('model_list_fetch_error: ' + (e.message||e));
    }
  }
  throw new Error('Groq API error after retries (including dynamic lookup):\n' + errors.join('\n'));
}
