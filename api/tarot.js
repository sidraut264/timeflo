// Vercel Serverless Function for Tarot and Tea Oracle AI Readings
// Powered by Google Gemini via Vercel Environment Variables (GEMINI_API_KEY or GOOGLE_API_KEY)

module.exports = async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please send a POST request.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in Vercel environment variables. Please add GEMINI_API_KEY in your Vercel project dashboard.'
    });
  }

  try {
    const { question, category = 'general', drawnCards = [], prompt: customPrompt } = req.body || {};

    let prompt = customPrompt;
    if (!prompt) {
      const cardListText = drawnCards.map((item, idx) => 
        `${idx + 1}. Position: "${item.positionTitle || 'Position ' + (idx + 1)}" | Card: "${item.card?.name || 'Card'}" (${item.isReversed ? 'Reversed / Inverted' : 'Upright'})`
      ).join('\n');

      prompt = `You are "The Oracle", a mysterious, sharp-witted tarot reader who is playfully sarcastic and brutally honest, but genuinely perceptive and grounded.
Category: ${category}
User Question: "${question || 'What does fate have in store for me right now?'}"
Cards drawn:
${cardListText}

Please respond ONLY with valid, raw JSON (no markdown formatting, no backticks, no markdown fence):
{
  "interpretations": [
    ${drawnCards.map((c, i) => `{"cardIndex": ${i}, "oracleTake": "A 2-3 sentence sarcastic, witty, and deeply perceptive reading of this card in this position for their question."}`).join(',\n    ')}
  ],
  "cosmicVerdict": "A 2-3 sentence overarching witty roast and cosmic verdict synthesizing all drawn cards.",
  "cosmicDare": "One bold, slightly cheeky, practical challenge for the user to do today."
}`;
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json"
        }
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Gemini API upstream error:', apiResponse.status, errorText);
      return res.status(apiResponse.status).json({
        error: 'Upstream Gemini API error',
        details: errorText
      });
    }

    const data = await apiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({ error: 'Empty response returned from Gemini API' });
    }

    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error handling Tarot reading:', error);
    return res.status(500).json({
      error: 'Failed to generate Oracle reading',
      message: error.message
    });
  }
};
