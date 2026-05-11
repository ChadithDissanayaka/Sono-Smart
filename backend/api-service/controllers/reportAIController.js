const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:9000';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000');

// Local fallback
const FALLBACK_DATA = {
  'liver function test': { instructions: 'Avoid alcohol before testing. Follow fasting instructions if required.', conditionDetails: 'Used to detect hepatitis, fatty liver disease, cirrhosis, and liver damage.', additionalNotes: 'Elevated ALT and AST levels may indicate liver inflammation.' },
  'renal function test': { instructions: 'Drink enough water unless doctor advises otherwise.', conditionDetails: 'Evaluates kidney performance and checks for kidney failure or infection.', additionalNotes: 'Creatinine and urea levels are key indicators.' },
  'abdominal ultrasound': { instructions: 'Usually fasting for 6–8 hours before scan.', conditionDetails: 'Detects enlarged spleen, infections, trauma, or blood disorders.', additionalNotes: 'Splenomegaly may be linked to liver disease or infections.' },
  'gallbladder ultrasound': { instructions: 'Fast for several hours before examination.', conditionDetails: 'Used to identify gallstones, inflammation, or bile duct blockage.', additionalNotes: 'Pain after fatty meals is a common symptom.' },
  'urinalysis': { instructions: 'Provide a clean urine sample.', conditionDetails: 'Detects urinary tract infections, bladder inflammation, or blood in urine.', additionalNotes: 'Frequent urination and burning sensation are common signs.' },
  'colonoscopy': { instructions: 'Follow bowel cleansing preparation instructions carefully.', conditionDetails: 'Helps diagnose ulcers, polyps, inflammation, or colorectal cancer.', additionalNotes: 'Patients may receive mild sedation during the procedure.' },
};

function getFallback(diagnosticName) {
  const key = diagnosticName.toLowerCase().trim();
  if (FALLBACK_DATA[key]) return FALLBACK_DATA[key];
  const partial = Object.keys(FALLBACK_DATA).find(k => key.includes(k) || k.includes(key));
  if (partial) return FALLBACK_DATA[partial];
  return {
    instructions: "Follow your doctor's preparation instructions before the procedure.",
    conditionDetails: 'This diagnostic evaluates the relevant organ or system for abnormalities.',
    additionalNotes: 'Consult your physician for interpretation of results.'
  };
}

// Shared proxy logic 
async function callAiService(endpoint, diagnosticName, organName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticName, organName }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`ai-service ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Claude route handler
const generateWithClaude = async (req, res) => {
  const { diagnosticName, organName } = req.body;
  if (!diagnosticName) return res.status(400).json({ success: false, message: 'diagnosticName is required' });

  try {
    const result = await callAiService('claude', diagnosticName, organName);
    return res.status(200).json({ success: true, source: 'claude', data: result.data });
  } catch (error) {
    console.warn(`Claude via ai-service failed (${error.message}), using fallback`);
    return res.status(200).json({ success: true, source: 'fallback', data: getFallback(diagnosticName) });
  }
};

//GPT route handler
const generateWithGPT = async (req, res) => {
  const { diagnosticName, organName } = req.body;
  if (!diagnosticName) return res.status(400).json({ success: false, message: 'diagnosticName is required' });

  try {
    const result = await callAiService('gpt', diagnosticName, organName);
    return res.status(200).json({ success: true, source: 'gpt', data: result.data });
  } catch (error) {
    console.warn(`GPT via ai-service failed — ${error.name}: ${error.message}`);
    return res.status(200).json({
      success: true,
      source: 'fallback',
      data: getFallback(diagnosticName)
    });
  }
};

module.exports = { generateWithClaude, generateWithGPT };
