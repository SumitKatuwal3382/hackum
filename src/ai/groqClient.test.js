import { buildPrompt, getStudySuggestion } from './groqClient';

describe('groqClient', () => {
  test('buildPrompt includes student and weaknesses', () => {
    const prompt = buildPrompt({
      student: { name: 'Ava', major: 'Math', gpa: 3.9 },
      weaknesses: [
        { concept_id: 'LIM', mastery: 0.4, concept: { name: 'Limits' } },
        { concept_id: 'INT', mastery: 0.6, concept: { name: 'Integration' } }
      ],
      plan: { allocations: [ { name: 'Limits', minutes: 45, projected: 0.55, current: 0.4 } ] },
      day: 'Tue',
      hourNow: 10
    });
    expect(prompt).toMatch(/Ava/);
    expect(prompt).toMatch(/Limits/);
    expect(prompt).toMatch(/Tue 10:00/);
  });

  test('getStudySuggestion rejects without API key', async () => {
    delete process.env.REACT_APP_GROQ_API_KEY;
    await expect(getStudySuggestion({})).rejects.toThrow(/Missing REACT_APP_GROQ_API_KEY/);
  });
});
