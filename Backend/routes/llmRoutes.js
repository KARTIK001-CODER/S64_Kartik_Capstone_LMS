import express from 'express';
import axios from 'axios';

const router = express.Router();

// Configuration for local LLM
const LLM_CONFIG = {
  // For Ollama (default) - Updated for Llama 3.2:1b
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2:1b',

  // For custom LLM server
  CUSTOM_LLM_URL: process.env.CUSTOM_LLM_URL,

  // Mock mode for development
  MOCK_MODE: process.env.MOCK_MODE === 'true' || false
};

// Mock responses for development
const MOCK_RESPONSES = {
  'javascript': ' programming, web development, frontend',
  'python': ' programming, data science, machine learning',
  'react': ' development, frontend, web applications',
  'node': 'js backend development, server-side programming',
  'data': ' science, analytics, machine learning',
  'machine': ' learning, AI, artificial intelligence',
  'web': ' development, design, frontend, backend',
  'mobile': ' app development, iOS, Android',
  'design': ' UI/UX, graphic design, web design',
  'business': ' management, entrepreneurship, marketing',
  'marketing': ' digital marketing, social media, SEO',
  'finance': ' investment, accounting, financial planning',
  'health': 'care, medical, nursing, fitness',
  'cooking': ' culinary arts, food preparation, recipes',
  'music': ' production, instruments, theory',
  'art': ' drawing, painting, digital art',
  'photography': ' camera techniques, editing, composition',
  'language': ' learning, speaking, grammar',
  'math': 'ematics, algebra, calculus, statistics',
  'science': ' physics, chemistry, biology',
  'history': ' world history, ancient civilizations',
  'psychology': ' human behavior, mental health',
  'philosophy': ' ethics, logic, critical thinking',
  'java': ' programming, enterprise development',
  'c++': ' programming, systems development',
  'sql': ' database, data management',
  'aws': ' cloud computing, amazon web services',
  'docker': ' containerization, devops',
  'git': ' version control, software development',
  'default': ' courses, learning, education'
};

const getMockResponse = (prompt) => {
  const lowerPrompt = prompt.toLowerCase().trim();

  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lowerPrompt.includes(key)) {
      return response;
    }
  }

  return MOCK_RESPONSES.default;
};

const callOllama = async (prompt) => {
  try {
    const response = await axios.post(`${LLM_CONFIG.OLLAMA_URL}/api/generate`, {
      model: LLM_CONFIG.OLLAMA_MODEL,
      prompt: `You are a helpful AI assistant. Complete the following course search query with relevant keywords. Only provide the completion, no explanations.

Query: ${prompt}
Completion:`,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 50,
        stop: ['\n', '.', '!', '?']
      }
    });

    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama API error:', error.message);
    throw new Error('Failed to get completion from Ollama');
  }
};

const callCustomLLM = async (prompt) => {
  try {
    const response = await axios.post(LLM_CONFIG.CUSTOM_LLM_URL, {
      prompt: `Complete this code: ${prompt}`,
      max_tokens: 100,
      temperature: 0.1
    });

    return response.data.completion || response.data.text;
  } catch (error) {
    console.error('Custom LLM API error:', error.message);
    throw new Error('Failed to get completion from custom LLM');
  }
};

/**
 * @openapi
 * /api/llm/complete:
 *   post:
 *     summary: Get autocomplete suggestions for course search
 *     tags: [LLM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt: { type: string }
 *               context: { type: string }
 *     responses:
 *       200:
 *         description: Completion result
 *       400:
 *         description: Prompt is required
 *       500:
 *         description: LLM service error
 */
router.post('/complete', async (req, res) => {
  try {
    const { prompt, context = '' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    let completion;

    if (LLM_CONFIG.MOCK_MODE) {
      completion = getMockResponse(prompt);
    } else if (LLM_CONFIG.CUSTOM_LLM_URL) {
      completion = await callCustomLLM(prompt);
    } else {
      completion = await callOllama(prompt);
    }

    res.json({
      success: true,
      completion,
      prompt,
      model: LLM_CONFIG.MOCK_MODE ? 'mock' : (LLM_CONFIG.CUSTOM_LLM_URL ? 'custom' : LLM_CONFIG.OLLAMA_MODEL)
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      error: 'Failed to generate completion',
      details: error.message
    });
  }
});

/**
 * @openapi
 * /api/llm/health:
 *   get:
 *     summary: Check LLM service health
 *     tags: [LLM]
 *     responses:
 *       200:
 *         description: LLM service status
 *       503:
 *         description: LLM service unavailable
 */
router.get('/health', async (req, res) => {
  try {
    if (LLM_CONFIG.MOCK_MODE) {
      return res.json({
        status: 'healthy',
        mode: 'mock',
        message: 'Mock mode enabled'
      });
    }

    if (LLM_CONFIG.CUSTOM_LLM_URL) {
      await axios.get(LLM_CONFIG.CUSTOM_LLM_URL.replace('/api/complete', '/health'));
    } else {
      await axios.get(`${LLM_CONFIG.OLLAMA_URL}/api/tags`);
    }

    res.json({
      status: 'healthy',
      mode: LLM_CONFIG.CUSTOM_LLM_URL ? 'custom' : 'ollama',
      model: LLM_CONFIG.OLLAMA_MODEL
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'LLM service not available',
      details: error.message
    });
  }
});

export default router;
