const { Groq } = require('groq-sdk');
const { OpenRouter } = require('@openrouter/sdk');

// Clients

// Using Groq as Claude replacement
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// OpenRouter GPT
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

// Prompt Builder

const buildPrompt = (diagnosticName, organName) => `
You are a medical report assistant for an ultrasound training application.

Given the diagnostic information below, generate concise and professional report fields.

Diagnostic Name: ${diagnosticName}
${organName ? `Organ: ${organName}` : ''}

Respond ONLY with a valid JSON object.

{
  "instructions": "Brief patient preparation instructions (1-2 sentences)",
  "conditionDetails": "What this diagnostic detects or evaluates (1-2 sentences)",
  "additionalNotes": "Key clinical indicators or signs to note (1-2 sentences)"
}
`.trim();

// Safe JSON Parser

const parseAIResponse = (text) => {

  try {

    return JSON.parse(
      text.replace(/```json|```/g, '').trim()
    );

  } catch (error) {

    console.error('JSON Parse Error:', text);

    throw new Error('Invalid JSON response from AI');
  }
};

// Claude Endpoint (Using Groq)
// Endpoint: /api/ai/claude

const generateWithClaude = async (req, res) => {

  const { diagnosticName, organName } = req.body;

  if (!diagnosticName) {

    return res.status(400).json({
      success: false,
      message: 'diagnosticName is required'
    });
  }

  try {

    const completion = await groq.chat.completions.create({

      messages: [
        {
          role: 'user',
          content: buildPrompt(diagnosticName, organName)
        }
      ],

      model: 'meta-llama/llama-4-scout-17b-16e-instruct',

      temperature: 0.5,

      max_completion_tokens: 1024,

      top_p: 1,

      stream: false
    });

    const text =
      completion?.choices?.[0]?.message?.content || '';

    const fields = parseAIResponse(text);

    return res.status(200).json({
      success: true,
      provider: 'groq',
      endpoint: 'claude',
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      data: fields
    });

  } catch (error) {

    console.error('Claude error:', error);

    return res.status(500).json({
      success: false,
      message: 'Claude generation failed',
      error: error.message
    });
  }
};

// OpenRouter GPT
// Endpoint: /api/ai/gpt
const generateWithGPT = async (req, res) => {

  const { diagnosticName, organName } = req.body;

  if (!diagnosticName) {

    return res.status(400).json({
      success: false,
      message: 'diagnosticName is required'
    });
  }

  try {

    const completion = await openrouter.chat.send({
      chatRequest: {

        model: 'openai/gpt-oss-120b:free',

        messages: [
          {
            role: 'user',
            content: buildPrompt(diagnosticName, organName)
          }
        ]
      }
    });

    const text =
      completion?.choices?.[0]?.message?.content || '';

    const fields = parseAIResponse(text);

    return res.status(200).json({
      success: true,
      provider: 'openrouter',
      model: 'openai/gpt-oss-120b:free',
      data: fields
    });

  } catch (error) {

    console.error('OpenRouter error:', error);

    return res.status(500).json({
      success: false,
      message: 'OpenRouter generation failed',
      error: error.message
    });
  }
};

module.exports = {
  generateWithClaude,
  generateWithGPT
};