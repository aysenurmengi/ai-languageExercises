import axios from 'axios';

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

// Rate limiting için değişkenler
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 saniyeye çıkaralım

// Retry mekanizması için değişkenler
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// API key kontrolü
if (!API_KEY) {
  console.error('API Key is missing. Make sure .env file exists and contains REACT_APP_OPENAI_API_KEY');
} else if (!API_KEY.startsWith('sk-')) {
  console.error('Invalid API Key format. OpenAI API keys should start with "sk-"');
}

const generateMongoId = () => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const randomPart = Math.random().toString(16).substr(2, 18);
  return timestamp + randomPart;
};

// Rate limiting fonksiyonu
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
};

// Retry fonksiyonu
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

const openaiService = {
  generateExercise: async () => {
    if (!API_KEY) {
      throw new Error('API Key is not configured');
    }

    const makeRequest = async () => {
      await waitForRateLimit();

      // API key kontrolü
      if (!API_KEY || !API_KEY.startsWith('sk-')) {
        throw new Error('Invalid API key configuration');
      }

      const prompt = {
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Create an educational fill-in-the-blank exercise with 8 questions.
Requirements:
- Mix different topics (science, history, arts, technology, etc.)
- Each sentence should have one blank marked with _____
- Make sentences challenging but understandable
- Ensure answers are single words or short phrases
- Make content educational and interesting

Return ONLY a JSON object in this exact format:
{
  "wordMatching": {
    "example": {
      "question": {
        "value": "The process of plants converting sunlight into energy is called _____.",
        "_id": "example-q-1",
        "id": "example-q-1"
      },
      "answer": {
        "value": "photosynthesis",
        "_id": "example-a-1",
        "id": "example-a-1"
      }
    },
    "questions": [
      {
        "value": "Question with _____ here",
        "_id": "q1",
        "id": "q1"
      }
    ],
    "answers": [
      {
        "value": "answer",
        "_id": "a1",
        "id": "a1"
      }
    ]
  }
}`
        }],
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };

      const response = await axios({
        method: 'post',
        url: BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY.trim()}` // API key'i temizle
        },
        data: prompt,
        timeout: 30000
      });

      return response;
    };

    try {
      const response = await retryWithBackoff(makeRequest);

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      const jsonStr = response.data.choices[0].message.content;
      const rawData = JSON.parse(jsonStr);

      const formattedResponse = {
        wordMatching: {
          example: {
            question: {
              ...rawData.wordMatching.example.question,
              _id: generateMongoId(),
              id: generateMongoId()
            },
            answer: {
              ...rawData.wordMatching.example.answer,
              _id: generateMongoId(),
              id: generateMongoId()
            }
          },
          questions: rawData.wordMatching.questions.map(q => ({
            ...q,
            _id: generateMongoId(),
            id: generateMongoId()
          })),
          answers: rawData.wordMatching.answers.map(a => ({
            ...a,
            _id: generateMongoId(),
            id: generateMongoId()
          }))
        }
      };

      return formattedResponse;

    } catch (error) {
      console.error('API Error:', error);
      if (error.response?.data) {
        console.error('Error Response:', error.response.data);
      }
      if (error.response?.status === 429) {
        throw new Error('Service is busy. Please wait a few seconds and try again.');
      }
      throw new Error('Failed to generate exercise. Please try again later.');
    }
  }
};

export default openaiService; 