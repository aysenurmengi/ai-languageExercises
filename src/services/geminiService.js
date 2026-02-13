import axios from 'axios';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Hugging Face API için gerekli sabitleri ekleyelim
const HF_API_KEY = process.env.REACT_APP_HF_API_KEY;
const HF_API_URL = "api-inference.huggingface.co/models/stabilityai/stable-diffusion-2";

// Konfigürasyon
const CONFIG = {
  TIMEOUT: 30000, // 30 saniye
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 saniye
};

// API key kontrolü ekleyelim
if (!API_KEY) {
  console.error('API Key is missing. Make sure .env file exists and contains REACT_APP_GEMINI_API_KEY');
}

// Retry fonksiyonu
const retryOperation = async (operation, retries = CONFIG.MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.log(`Attempt ${i + 1} failed, retrying in ${CONFIG.RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
    }
  }
};

const validateResponse = (data, numberOfQuestions) => {
  if (!data.wordMatching) throw new Error('Missing wordMatching object');
  if (!data.wordMatching.example) throw new Error('Missing example object');
  if (!data.wordMatching.example.question) throw new Error('Missing example question');
  if (!data.wordMatching.example.answer) throw new Error('Missing example answer');
  if (!Array.isArray(data.wordMatching.questions)) throw new Error('Questions must be an array');
  if (!Array.isArray(data.wordMatching.answers)) throw new Error('Answers must be an array');
  if (data.wordMatching.questions.length !== parseInt(numberOfQuestions)) 
    throw new Error(`Must have exactly ${numberOfQuestions} questions`);
  if (data.wordMatching.answers.length !== parseInt(numberOfQuestions)) 
    throw new Error(`Must have exactly ${numberOfQuestions} answers`);
  
  return true;
};

// Ortak axios request metodu
const makeGeminiRequest = async (prompt) => {
  try {
    const response = await axios.post(
      `${BASE_URL}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }
    );

    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('No response from API');
    }

    const content = response.data.candidates[0].content.parts[0].text;
    
    try {
      // API'den gelen string'i JSON'a çevirmeyi dene
      const jsonResponse = JSON.parse(content);
      return jsonResponse;
    } catch (parseError) {
      console.error('JSON Parse Error:', content);
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error.response) {
      console.error('Error Response:', error.response.data);
    }
    throw new Error(error.message || 'Failed to communicate with Gemini API');
  }
};

const makeWordMatchingRequest = async (formData) => {
  const { title, numberOfQuestions, level, questionFocus, listOfWords } = formData;

  // Kullanıcının girdiği kelimeleri işle
  const userWords = listOfWords ? listOfWords.split(',').map(word => word.trim()).filter(word => word) : [];
  const requiredWords = parseInt(numberOfQuestions);
  const remainingCount = requiredWords - userWords.length;

  const promptText = `Create a word matching exercise with these specifications:
- Title: ${title}
- Number of questions: ${numberOfQuestions}
- Level: ${level}
- Question types: ${questionFocus.join(', ')}

Instructions:
1. First, use exactly these user-provided words (${userWords.length} words): ${userWords.join(', ')}
2. Then, generate ${remainingCount} additional words that are relevant to the level and context
3. Create ${numberOfQuestions} total educational sentences appropriate for ${level} level
4. Each sentence should have one blank marked with _____
5. Focus on ${questionFocus.join(' and ')} type questions
6. The word bank must include:
   - All user-provided words: ${userWords.join(', ')}
   - Plus ${remainingCount} AI-generated words
7. Total number of words in word bank must be exactly ${numberOfQuestions}

Return ONLY a JSON object in this exact format:
{
  "wordMatching": {
    "example": {
      "question": "Example sentence with _____ here.",
      "answer": "example"
    },
    "questions": [
      {
        "value": "Question sentence with _____ here",
        "_id": "q1",
        "id": "q1"
      }
    ],
    "answers": [
      {
        "value": "answer word",
        "_id": "a1",
        "id": "a1"
      }
    ]
  }
}`;

  const rawData = await makeGeminiRequest(promptText);
  
  // Validate response ile soru sayısını kontrol et
  validateResponse(rawData, numberOfQuestions);

  // Kullanıcının kelimelerinin cevaplar arasında olduğunu kontrol et
  if (userWords.length > 0) {
    const answers = rawData.wordMatching.answers.map(a => a.value.toLowerCase());
    const missingWords = userWords.filter(word => 
      !answers.includes(word.toLowerCase())
    );
    
    if (missingWords.length > 0) {
      throw new Error(`Some provided words are missing from the exercise: ${missingWords.join(', ')}`);
    }
  }

  return{
    wordMatching: {
      example: rawData.wordMatching.example,
      questions: rawData.wordMatching.questions.map((q, index) => ({
        value: q.value,
        _id : `q${index + 1}`,
        id: `q${index + 1}`
      })),
      answers: rawData.wordMatching.answers.map((a, index) => ({
        value: a.value,
        _id: `a${index + 1}`,
        id: `a${index + 1}`
      }))
    }
  };
};

const makeMultipleChoiceRequest = async (formData) => {
  const { title, numberOfQuestions, level, questionFocus, listOfWords } = formData;

  // Kullanıcının girdiği kelimeleri işle
  const userWords = listOfWords ? listOfWords.split(',').map(word => word.trim()).filter(word => word) : [];
  const requiredWords = parseInt(numberOfQuestions);
  const remainingCount = requiredWords - userWords.length;

  const promptText = `Create a multiple choice exercise with these specifications:
- Title: ${title}
- Number of questions: ${numberOfQuestions}
- Level: ${level}
- Question types: ${questionFocus.join(', ')}

Instructions:
1. First, create questions using these exact words (${userWords.length} words): ${userWords.join(', ')}
   - Each user-provided word MUST be the correct answer for its question
   - Create appropriate distractors for each question
2. Then, generate ${remainingCount} additional questions
3. Each question must:
   - Have 4 options (A, B, C, D)
   - Be appropriate for ${level} level
   - Focus on ${questionFocus.join(' and ')} type questions
4. For user-provided words:
   - Word must be the correct answer
   - Create a question that tests understanding of the word
   - Generate 3 plausible but incorrect options
5. Total questions must be exactly ${numberOfQuestions}

Example format for user-provided word "happy":
{
  "text": "Which word means 'feeling or showing pleasure or contentment'?",
  "options": ["A) happy", "B) lucky", "C) busy", "D) funny"],
  "correctAnswer": "A) happy"
}

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correctAnswer": "A) option1"
    }
  ]
}`;

  const rawData = await makeGeminiRequest(promptText);
  
  // Kullanıcının kelimelerinin doğru cevaplar arasında olduğunu kontrol et
  if (userWords.length > 0) {
    const correctAnswers = rawData.questions.map(q => 
      q.correctAnswer.substring(3).toLowerCase().trim()
    );
    
    const missingWords = userWords.filter(word => 
      !correctAnswers.includes(word.toLowerCase().trim())
    );
    
    if (missingWords.length > 0) {
      throw new Error(`Some provided words are not used as correct answers: ${missingWords.join(', ')}`);
    }
  }

  // Toplam soru sayısının doğru olduğunu kontrol et
  if (rawData.questions.length !== requiredWords) {
    throw new Error(`Exercise must have exactly ${requiredWords} questions, but got ${rawData.questions.length}`);
  }

  return rawData;
};

const makeMatchingActivityRequest = async (formData) => {
  const { title, numberOfQuestions, level, questionFocus, listOfWords } = formData;

  // Kullanıcının girdiği kelimeleri işle
  const userWords = listOfWords ? listOfWords.split(',').map(word => word.trim()).filter(word => word) : [];
  const requiredPairs = parseInt(numberOfQuestions);
  const remainingCount = requiredPairs - Math.ceil(userWords.length / 2);

  const promptText = `Create a matching activity with these specifications:
- Title: ${title}
- Number of pairs: ${numberOfQuestions}
- Level: ${level}
- Focus: ${questionFocus.join(', ')}

Instructions:
1. First, use these user-provided words to create pairs (${userWords.length} words): ${userWords.join(', ')}
2. Then, generate ${remainingCount} additional pairs that are relevant to the level and context
3. Create ${numberOfQuestions} total pairs appropriate for ${level} level
4. Focus on ${questionFocus.join(' and ')} relationships
5. The matching items must include:
   - Pairs using user-provided words where possible: ${userWords.join(', ')}
   - Plus additional AI-generated pairs to reach ${numberOfQuestions} total pairs
6. Total number of pairs must be exactly ${numberOfQuestions}

Return ONLY a JSON object in this exact format:
{
  "leftItems": ["item1", "item2", "item3"],
  "rightItems": ["match1", "match2", "match3"],
  "pairs": [0, 1, 2]
}`;

  const rawData = await makeGeminiRequest(promptText);
  
  // Kullanıcının kelimelerinin eşleştirmelerde kullanıldığını kontrol et
  if (userWords.length > 0) {
    const allItems = [...rawData.leftItems, ...rawData.rightItems].map(item => item.toLowerCase());
    const missingWords = userWords.filter(word => 
      !allItems.some(item => item.includes(word.toLowerCase()))
    );
    
    if (missingWords.length > 0) {
      throw new Error(`Some provided words are missing from the matching items: ${missingWords.join(', ')}`);
    }
  }

  // Toplam eşleştirme sayısının doğru olduğunu kontrol et
  if (rawData.leftItems.length !== requiredPairs) {
    throw new Error(`Exercise must have exactly ${requiredPairs} pairs, but got ${rawData.leftItems.length}`);
  }

  return rawData;
};

const makeSentenceCorrectionRequest = async (formData) => {
  // Sentence Correction için API isteği
};

const makeTensePracticeRequest = async (formData) => {
  // Tense Practice için API isteği
};

const makeGrammarMatchingRequest = async (formData) => {
  // Grammar Matching için API isteği
};

const makeDialogueCompletionRequest = async (formData) => {
  const { title, numberOfQuestions, level, context } = formData;

  const promptText = `Create a dialogue completion exercise with these specifications:
- Title: ${title}
- Number of questions: ${numberOfQuestions}
- Level: ${level}
- Context: ${context}

Create ${numberOfQuestions} dialogue situations where one part needs to be completed.
For each dialogue:
1. Provide a clear context/situation
2. Write the dialogue with a gap where appropriate
3. Provide 3 possible responses where only one is correct
4. Make sure the language level is appropriate for ${level}

Return ONLY a JSON object in this exact format:
{
  "title": "The title of the exercise",
  "questions": [
    {
      "context": "Situation description (e.g., 'At a restaurant...')",
      "dialogue": "A: Would you like to order now?\\nB: _____\\nA: I'll bring the menu right away.",
      "options": ["Yes, please", "No, thanks", "Maybe later"],
      "correctAnswer": "Yes, please"
    }
  ]
}`;

  const rawData = await makeGeminiRequest(promptText);

  return rawData;
};

const makeClozeTestRequest = async (formData) => {
  const { title, numberOfQuestions, level, grammarTopic, context, additionalRules, autoGenerate } = formData;

  const promptText = `Create a cloze test exercise with these specifications:
- Title: ${title}
- Number of questions: ${numberOfQuestions} (this is the exact number of blanks needed)
- Level: ${level}
- Grammar Topic: ${grammarTopic}
- Context: ${context}
${!autoGenerate && additionalRules ? `- Additional Rules: ${additionalRules}` : ''}

Instructions:
1. Create a coherent text with EXACTLY ${numberOfQuestions} blanks marked with _____
2. For each blank:
   - Provide exactly 3 options
   - Make sure only one option is correct
   - Options should be grammatically related to test ${grammarTopic}
   - Options should be level-appropriate (${level})
3. The total number of blanks must be exactly ${numberOfQuestions}
4. Each blank should focus on ${grammarTopic.toLowerCase()} structures

Return ONLY a JSON object in this exact format:
{
  "title": "The title of the text",
  "text": "The text with _____ as blanks (exactly ${numberOfQuestions} blanks)",
  "questions": [
    {
      "options": ["option1", "option2", "option3"],
      "correctAnswer": "option1"
    }
  ]
}`;

  const rawData = await makeGeminiRequest(promptText);

  // Soru sayısının doğru olduğunu kontrol et
  if (rawData.questions.length !== parseInt(numberOfQuestions)) {
    throw new Error(`Exercise must have exactly ${numberOfQuestions} questions, but got ${rawData.questions.length}`);
  }

  // Metin içindeki boşluk sayısını kontrol et
  const blankCount = (rawData.text.match(/_____/g) || []).length;
  if (blankCount !== parseInt(numberOfQuestions)) {
    throw new Error(`Text must have exactly ${numberOfQuestions} blanks, but got ${blankCount}`);
  }

  return rawData;
};

// Basit bir test fonksiyonu
const testStableDiffusion = async () => {
  try {
    const response = await axios({
      url: HF_API_URL,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: "A simple cartoon of a cat"
      }
    });

    console.log('API Test Response:', response.status);
    return true;
  } catch (error) {
    console.error('API Test Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
};

// Stable Diffusion ile resim oluşturma fonksiyonu
const generateImageWithStableDiffusion = async (prompt) => {
  try {
    // İlk olarak modelin hazır olup olmadığını kontrol et
    const checkModel = await axios({
      url: HF_API_URL,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: { inputs: prompt }
    });

    // Eğer model yüklenmemişse, bekle ve tekrar dene
    if (checkModel.status === 503) {
      console.log('Model loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 saniye bekle
      return generateImageWithStableDiffusion(prompt); // Recursive çağrı
    }

    const response = await axios({
      url: HF_API_URL,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: prompt,
        parameters: {
          negative_prompt: "blurry, bad quality, text, watermark",
          num_inference_steps: 30, // Hızlı sonuç için düşürüldü
          guidance_scale: 7.5,
          width: 512,
          height: 512
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      },
      responseType: 'arraybuffer',
      timeout: 30000 // 30 saniye timeout
    });

    // ArrayBuffer'ı base64'e çevir
    const base64Image = Buffer.from(response.data).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return imageUrl;
  } catch (error) {
    console.error('Image Generation Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Özel hata mesajları
    if (error.response?.status === 503) {
      throw new Error('Model is currently loading. Please try again in a few moments.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The server might be busy.');
    }

    throw new Error('Failed to generate image: ' + error.message);
  }
};

const makeImageExerciseRequest = async (formData) => {
  const { title, numberOfQuestions, level } = formData;

  // Eylem ve mekan dizileri
  const actions = [
    "running", "reading a book", "swimming", "painting a picture",
    "cooking", "jumping", "cycling", "playing guitar", "writing",
    "dancing", "singing", "studying", "eating", "drinking coffee"
  ];

  const locations = [
    "in a park", "at home", "on the beach", "in a classroom",
    "in the mountains", "in a library", "in a garden", "in a cafe",
    "on a playground", "in a gym", "in the kitchen", "in a studio"
  ];

  // Rastgele eylem ve mekan seç
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];

  // Stable Diffusion için prompt oluştur
  const imagePrompt = `A simple, clear digital art of a person ${randomAction} ${randomLocation}. 
    Minimalist style, clean lines, educational illustration, white background, 
    no text, high quality, suitable for language learning textbook`;

  try {
    // Stable Diffusion ile resim oluştur
    console.log('Generating image for:', imagePrompt);
    let attempts = 0;
    let generatedImageUrl;

    while (attempts < 3) {
      try {
        generatedImageUrl = await generateImageWithStableDiffusion(imagePrompt);
        console.log('Image generated successfully');
        break;
      } catch (error) {
        attempts++;
        if (attempts === 3) {
          throw error;
        }
        console.log(`Attempt ${attempts} failed, waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 saniye bekle
      }
    }

    const promptText = `Create a simple English exercise (${level} level) about this image.

The image shows: a person ${randomAction} ${randomLocation}

Create exactly ${numberOfQuestions} multiple-choice question(s) about what you see in the image.

Example format for questions:
"What is the person doing in the picture?"
With options like:
A) He is ${randomAction}.
B) He is ${actions[Math.floor(Math.random() * actions.length)]}.
C) He is ${actions[Math.floor(Math.random() * actions.length)]}.
D) He is ${actions[Math.floor(Math.random() * actions.length)]}.

Return ONLY a JSON object in this format:
{
  "title": "${title}",
  "imageUrl": "${generatedImageUrl}",
  "questions": [
    {
      "text": "What is the person doing in the picture?",
      "options": [
        "A) He is ${randomAction}.",
        "B) He is ${actions[Math.floor(Math.random() * actions.length)]}.",
        "C) He is ${actions[Math.floor(Math.random() * actions.length)]}.",
        "D) He is ${actions[Math.floor(Math.random() * actions.length)]}."
      ],
      "correctAnswer": "A) He is ${randomAction}."
    }
  ]
}

Rules:
1. Questions must focus on what is clearly visible in the image
2. Use simple present continuous tense (is + verb + ing)
3. Make all options and language appropriate for ${level} level
4. Include questions about:
   - The action being performed
   - The location
5. The correct answer should always describe what is actually shown in the image`;

    const rawData = await makeGeminiRequest(promptText);
    
    if (!rawData || !rawData.title || !rawData.imageUrl || !rawData.questions) {
      throw new Error('Invalid response structure');
    }

    if (!Array.isArray(rawData.questions) || rawData.questions.length !== parseInt(numberOfQuestions)) {
      throw new Error(`Exercise must have exactly ${numberOfQuestions} questions`);
    }

    rawData.questions.forEach((question, index) => {
      if (!question.text || !Array.isArray(question.options) || !question.correctAnswer) {
        throw new Error(`Invalid question structure at index ${index}`);
      }
      if (question.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (!question.options.includes(question.correctAnswer)) {
        throw new Error(`Correct answer must match one of the options for question ${index + 1}`);
      }
    });

    return {
      ...rawData,
      imageUrl: generatedImageUrl
    };
  } catch (error) {
    console.error('Error in makeImageExerciseRequest:', error);
    throw new Error(`Failed to generate exercise: ${error.message}`);
  }
};

const generateExercise = async (formData, exerciseType) => {
  try {
    let prompt;
    let reqNumberOfQuestions = formData.numberOfQuestions;
    
    if (exerciseType === 'wordMatching') {
      const { title, numberOfQuestions, level, questionFocus, listOfWords } = formData;
      
      const userWords = listOfWords ? listOfWords.split(',').map(word => word.trim()).filter(word => word) : [];
      const requiredWords = parseInt(numberOfQuestions);
      
      prompt = {
        title,
        level,
        questionFocus,
        numberOfQuestions: requiredWords,
        userWords,
        remainingWords: requiredWords - userWords.length
      };
    }
    // ... diğer exercise tipleri için olan kodlar ...

    const response = await makeRequest(prompt, exerciseType);
    validateResponse(response, reqNumberOfQuestions);
    return response;

  } catch (error) {
    console.error('Error generating exercise:', error);
    throw error;
  }
};

const makeRequest = async (prompt, exerciseType) => {
  try {
    let systemPrompt = '';
    
    if (exerciseType === 'wordMatching') {
      systemPrompt = `Create a word matching exercise with the following specifications:
        - Title: "${prompt.title}"
        - Level: ${prompt.level}
        - Number of questions: ${prompt.numberOfQuestions}
        ${prompt.userWords.length > 0 ? 
          `- Include these user-provided words: ${prompt.userWords.join(', ')}
           - Generate ${prompt.remainingWords} additional words that are relevant to the context` 
          : '- Generate all words automatically'}
        - Focus on: ${prompt.questionFocus.join(', ')}
        
        The exercise should:
        1. Use the user-provided words first (if any)
        2. Generate additional relevant words to reach the required number
        3. Create appropriate matching pairs for all words
        4. Ensure all content matches the specified level
        5. Maintain consistency in difficulty and theme`;
    }
    // ... diğer exercise tipleri için olan kodlar ...

    const response = await makeGeminiRequest(systemPrompt);

    return response;
  } catch (error) {
    // ... hata yönetimi ...
  }
};

const geminiService = {
  generateExercise: async (formData, exerciseType = 'wordMatching') => {
    if (!API_KEY) {
      throw new Error('API Key is not configured');
    }

    try {
      switch (exerciseType) {
        // Vocabulary exercises
        case 'wordMatching':
          return await retryOperation(() => makeWordMatchingRequest(formData));
        case 'multipleChoice':
          return await retryOperation(() => makeMultipleChoiceRequest(formData));
        case 'matchingActivity':
          return await retryOperation(() => makeMatchingActivityRequest(formData));
        
        // Grammar exercises
        case 'sentenceCorrection':
          return await retryOperation(() => makeSentenceCorrectionRequest(formData));
        case 'tensePractice':
          return await retryOperation(() => makeTensePracticeRequest(formData));
        case 'grammarMatching':
          return await retryOperation(() => makeGrammarMatchingRequest(formData));
        case 'dialogueCompletion':
          return await retryOperation(() => makeDialogueCompletionRequest(formData));
        case 'clozeTest':
          return await retryOperation(() => makeClozeTestRequest(formData));
        case 'imageExercise':
          return await retryOperation(() => makeImageExerciseRequest(formData));
        
        default:
          throw new Error('Unknown exercise type');
      }
    } catch (error) {
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again in a few moments.');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timed out. The server might be busy, please try again.');
      }

      throw new Error('Failed to generate exercise. Please try again.');
    }
  }
};

export default geminiService; 