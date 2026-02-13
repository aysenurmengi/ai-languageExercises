require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');  // Senkron işlemler için
const fsPromises = require('fs').promises;  // Promise tabanlı işlemler için
const crypto = require('crypto');
const { OpenAI } = require("@langchain/openai");
/*const { ChatOpenAI } = require("@langchain/openai");*/
/*const { OpenAIEmbeddings } = require('langchain/embeddings/openai');*/
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const app = express();


// CORS ayarları
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

// Server başlangıcında embeddings klasörünü kontrol et, yoksa oluştur varsa logla
const EMBEDDINGS_DIR = path.join(__dirname, 'embeddings');
if (!fs.existsSync(EMBEDDINGS_DIR)) {
  console.log('Creating embeddings directory...');
  fs.mkdirSync(EMBEDDINGS_DIR, { recursive: true });
  console.log('Embeddings directory created at:', EMBEDDINGS_DIR);
}

/*
// Dosya hash'ini hesapla, aynı dosyanın birden fazla kez yüklenmesini önlemek için
const calculateFileHash = async (buffer) => {
  const hash = crypto.createHash('md5');
  hash.update(buffer);
  return hash.digest('hex');
};

// Embedding'leri kaydetme fonksiyonunu güncelle
const saveEmbeddings = async (fileHash, embeddings) => {
  const embeddingPath = path.join(EMBEDDINGS_DIR, `${fileHash}.json`);
  await fsPromises.writeFile(embeddingPath, JSON.stringify(embeddings));
};

// bir dosyanın embedding'ini kontrol etme fonksiyonu
const checkEmbeddings = async (fileHash) => {
  const embeddingPath = path.join(EMBEDDINGS_DIR, `${fileHash}.json`);
  try {
    const data = await fsPromises.readFile(embeddingPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};
*/
// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // uploads klasörünü kontrol et ve oluştur
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .pdf files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// OpenAI ve LangChain konfigürasyonu
const openai = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY
});

// Bellek içi vektör deposu
let documentEmbeddings = [];
let documentContent = '';

// OpenAI API yapılandırması
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const CHAT_MODEL = 'gpt-3.5-turbo';

// Embedding oluşturma fonksiyonu
async function createEmbedding(text) {
  try {
    console.log('Starting embedding creation...');
    
    // Text'i küçük parçalara böl
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Created ${chunks.length} chunks from text`);

    // OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    try {
      const vectors = await embeddings.embedDocuments(
        chunks.map(chunk => chunk.pageContent)
      );
      console.log('Successfully created embeddings');
      return vectors;
    } catch (embeddingError) {
      console.error('OpenAI Embedding Error:', embeddingError);
      throw new Error(`Failed to create embeddings: ${embeddingError.message}`);
    }

  } catch (error) {
    console.error('Error in createEmbedding:', error);
    throw new Error(`Embedding creation failed: ${error.message}`);
  }
}

// Cosinüs benzerliği hesaplama
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// En alakalı bölümleri bulma
function findRelevantChunks(questionEmbedding, topK = 3) {
  return documentEmbeddings
    .map((chunk, index) => ({
      text: chunk.text,
      similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
      index
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/*
// Metin parçalama fonksiyonu
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  
  return chunks;
}
*/

// Metni bölümlere ayıran fonksiyon
const splitTextIntoChunks = (text, maxLength = 12000) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
};

// Her bir bölüm için özet oluşturan fonksiyon
const summarizeChunk = async (chunk, wordLength = 300) => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `Create a concise summary that:
          - Uses the author's voice and perspective
          - Avoids third-person narration
          - Maintains the original narrative flow
          - Includes essential points
          - Keeps the original writing style`
        },
        {
          role: "user",
          content: `Summarize this text section:\n\n${chunk}`
        }
      ],
      temperature: 0.4,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
};

// Dosya işleme fonksiyonu
const processFile = async (file) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    switch (ext) {
      case '.pdf':
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(Buffer.from(dataBuffer));
        text = pdfData.text;
        break;

      case '.txt':
        text = fs.readFileSync(file.path, 'utf8');
        break;

      case '.doc':
      case '.docx':
        const docBuffer = fs.readFileSync(file.path);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        text = result.value;
        break;

      default:
        throw new Error('Unsupported file type');
    }

    return text
      .replace(/\r\n/g, '\n')
      .replace(/\f/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  } catch (error) {
    console.error('File processing error:', error); 
    throw new Error(`File processing failed: ${error.message}`);
  }
};

// Dosya işleme endpoint'i
app.post('/api/process-document', upload.single('file'), async (req, res) => {
  try {
    console.log('Processing document request received');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    const filePath = req.file.path;

    // Dosya içeriğini oku
    let fileContent;
    try {
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(fs.readFileSync(filePath));
        fileContent = pdfData.text;
      } else {
        fileContent = fs.readFileSync(filePath, 'utf8');
      }

      // Dosya hash'ini hesaplıyoruz, aynı dosyanın birden fazla kez yüklenmesini önlemek için
      const fileHash = crypto.createHash('md5').update(fileContent).digest('hex');
      console.log('Checking for existing embeddings with hash:', fileHash);

      // Mevcut embedding'leri kontrol et
      const embeddingPath = path.join(EMBEDDINGS_DIR, `${fileHash}.json`);
      
      if (fs.existsSync(embeddingPath)) {
        console.log('Found existing embeddings, loading from file');
        const existingData = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));
        
        // Geçici dosyayı temizle
        fs.unlinkSync(filePath);

        return res.json({
          message: 'File already processed',
          text: existingData.text,
          fileHash,
          fromCache: true
        });
      }

      console.log('No existing embeddings found, creating new ones');
      const embedding = await createEmbedding(fileContent);

      // Yeni embeddings'i kaydet
      const embeddingData = {
        text: fileContent,
        vectors: embedding,
        createdAt: new Date().toISOString()
      };

      await fs.promises.writeFile(
        embeddingPath,
        JSON.stringify(embeddingData, null, 2)
      );

      console.log('Successfully saved new embeddings');

      // Geçici dosyayı temizle
      fs.unlinkSync(filePath);

      return res.json({
        message: 'File processed successfully',
        text: fileContent,
        fileHash,
        fromCache: false
      });

    } catch (error) {
      console.error('Error processing file:', error);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in process-document:', error);
    return res.status(500).json({
      error: 'Failed to process document',
      details: error.message
    });
  }
});

// Text summarization endpoint
app.post('/api/summarize', upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    console.log('Summarization request received');

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    filePath = req.file.path;

    // Dosyayı işle
    const processedText = await processFile(req.file);

    if (!processedText || processedText.trim().length === 0) {
      throw new Error('Empty or invalid file content');
    }

    // Dosya hash'ini kontrol et ve varsa cached embeddings'i kullan
    const fileHash = crypto.createHash('md5').update(processedText).digest('hex');
    const embeddingPath = path.join(EMBEDDINGS_DIR, `${fileHash}.json`);
    
    let vectors;
    if (fs.existsSync(embeddingPath)) {
      console.log('Using cached embeddings for summarization');
      const cachedData = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));
      vectors = cachedData.vectors;
    } else {
      console.log('Creating new embeddings for summarization');
      vectors = await createEmbedding(processedText);
    }

    // Metni bölümlere ayır
    const chunks = splitTextIntoChunks(processedText);
    
    // Her bölüm için özet oluştur
    const summaries = await Promise.all(
      chunks.map(async (chunk, index) => {
        console.log(`Processing chunk ${index + 1}/${chunks.length}`);
        return await summarizeChunk(chunk);
      })
    );
    
    // Özetleri birleştir
    const finalSummary = summaries.join('\n\n');

    console.log('Generating final summary...');

    // Son özeti oluştur
    const finalResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: "Combine these summaries into one coherent summary, maintaining the flow and style."
          },
          {
            role: "user",
            content: finalSummary
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('Summary generated successfully');

    res.json({
      text: processedText,
      summary: finalResponse.data.choices[0].message.content,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Summarization error:', error);
    
    let errorMessage = 'Failed to generate summary';
    let statusCode = 500;

    if (error.response?.status === 429) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Could not connect to OpenAI API. Please try again later.';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message 
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  }
});

// Question answering endpoint
app.post('/api/ask-question', async (req, res) => {
  try {
    const { question, fileHash } = req.body;
    
    if (!fileHash) {
      return res.status(400).json({ error: 'File hash is required' });
    }

    // Embedding dosyasını kontrol et
    const embeddingPath = path.join(EMBEDDINGS_DIR, `${fileHash}.json`);
    
    if (!fs.existsSync(embeddingPath)) {
      console.error('Embeddings not found for hash:', fileHash);
      return res.status(404).json({ error: 'Document embeddings not found' });
    }

    // Cached embeddings'i yükle
    console.log('Loading cached embeddings for question answering');
    const embeddingData = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));

    // Text splitter oluştur
    const splitter = new RecursiveCharacterTextSplitter({
      separator: ' ',
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Metni parçalara böl
    const docs = await splitter.createDocuments([embeddingData.text]);

    // Vector store oluştur
    const vectorStore = await MemoryVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    );

    // En alakalı dokümanları bul
    const relevantDocs = await vectorStore.similaritySearch(question, 20);

    // Context oluştur
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-3.5-turbo-16k',
      temperature: 0.7,
    });

    const prompt = `Context: ${context}\n\nQuestion: ${question}\n\nAnswer the question based on the context provided."`;
    console.log("Processing question:", question);

    // Soruyu yanıtla
    const response = await llm.invoke(prompt);
    console.log("Generated answer:", response);

    res.json({ 
      answer: response,
      fromCache: true 
    });

  } catch (error) {
    console.error('Error in ask-question:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      details: error.message
    });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Prompt'u güvenli hale getir
    const safePrompt = prompt.trim();
    const imagePrompt = `High quality, detailed illustration about ${safePrompt}. Show the concept in a clear and educational way. Use vibrant colors and modern style.`;

    const imageResponse = await axios.post(OPENAI_API_URL, {
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!imageResponse.data?.data?.[0]?.b64_json) {
      throw new Error('Invalid response from image generation API');
    }

    const imageData = imageResponse.data.data[0].b64_json;
    res.json({ imageUrl: `data:image/png;base64,${imageData}` });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.response?.data || error.message
    });
  }
});

// Question generation endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { prompt, level, numberOfQuestions } = req.body;

    if (!prompt || !level || !numberOfQuestions) {
      return res.status(400).json({ error: 'Prompt, level, and number of questions are required' });
    }

    // Level kontrolü ekle
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ 
        error: 'Invalid level',
        details: `Level must be one of: ${validLevels.join(', ')}`
      });
    }

    // İngilizce seviyelerine göre kelime ve dilbilgisi kısıtlamaları
    const levelGuidelines = {
      'A1': {
        vocabulary: 'Use only the most basic and common everyday words. No complex vocabulary.',
        structure: 'Use only simple present tense. Very short and basic sentences. No complex structures.',
        examples: 'Use words like: is, are, have, like, go, eat, drink, play, read, write',
        rules: [
          'Maximum 5-6 words per sentence',
          'Only use present simple tense',
          'Only basic question words (what, where, when)',
          'No passive voice, no complex tenses',
          'Focus on concrete objects and basic actions'
        ]
      },
      'A2': {
        vocabulary: 'Basic everyday vocabulary plus simple topic-specific words.',
        structure: 'Simple present and past tense. Basic future with "going to". Short, simple sentences.',
        examples: 'Can use: yesterday, tomorrow, always, sometimes, often, and, but, because',
        rules: [
          'Short simple sentences with basic conjunctions',
          'Present simple, past simple, going to future',
          'Common adjectives and adverbs',
          'Basic prepositions and articles',
          'Simple questions about daily life'
        ]
      },
      'B1': {
        vocabulary: 'Common everyday vocabulary plus some topic-specific terms.',
        structure: 'All basic tenses. Compound sentences. Some relative clauses.',
        examples: 'Can discuss: likes/dislikes, opinions, simple explanations, basic comparisons',
        rules: [
          'Longer sentences with multiple clauses',
          'All basic tenses including present perfect',
          'Comparative and superlative forms',
          'First conditional and basic modals',
          'Can express opinions and simple arguments'
        ]
      },
      'B2': {
        vocabulary: 'Wider range of vocabulary including some academic and abstract terms.',
        structure: 'More complex sentences. All tenses. Passive voice. Conditionals.',
        examples: 'Can discuss: advantages/disadvantages, causes/effects, recommendations',
        rules: [
          'Complex sentences and varied structures',
          'All tenses including perfect and continuous',
          'Passive voice and reported speech',
          'Second and third conditionals',
          'Can express detailed opinions and arguments'
        ]
      },
      'C1': {
        vocabulary: 'Advanced vocabulary including idiomatic expressions and academic terms.',
        structure: 'Complex academic language. All grammatical structures. Abstract concepts.',
        examples: 'Can discuss: implications, analysis, evaluation, detailed arguments',
        rules: [
          'Sophisticated sentence structures',
          'Advanced grammatical constructions',
          'Idiomatic expressions and colloquialisms',
          'Complex academic concepts',
          'Can express subtle differences in meaning'
        ]
      },
      'C2': {
        vocabulary: 'Sophisticated vocabulary including technical and specialized terms.',
        structure: 'Native-like command of complex structures. Professional academic language.',
        examples: 'Can discuss: complex theories, critical analysis, expert-level topics',
        rules: [
          'Native-like fluency and accuracy',
          'Complex academic and technical language',
          'Sophisticated argumentation',
          'Nuanced expression of ideas',
          'Professional and specialized terminology'
        ]
      }
    };

    const levelGuide = levelGuidelines[level];
    if (!levelGuide) {
      return res.status(400).json({ 
        error: 'Level guide not found',
        details: `Could not find guidelines for level: ${level}`
      });
    }

    const questionPrompt = `
      Topic: ${prompt}
      Task: Create ${numberOfQuestions} multiple-choice questions for ${level} level English learners.

      Language Level Guidelines (${level}):
      - Vocabulary Range: ${levelGuide.vocabulary}
      - Sentence Structure: ${levelGuide.structure}
      - Example Usage: ${levelGuide.examples}

      Strict Level Rules:
      ${levelGuide.rules.map(rule => '- ' + rule).join('\n  ')}

      Requirements:
      1. Questions MUST strictly follow ${level} level constraints:
         - Use ONLY vocabulary appropriate for ${level}
         - Follow ONLY grammatical structures allowed for ${level}
         - Keep sentence length and complexity appropriate for ${level}
         - Use examples and contexts familiar to ${level} learners

      2. Question Difficulty Progression:
         - Start with simpler questions within ${level} range
         - Gradually increase complexity while staying within ${level} limits
         - Ensure all questions are challenging but achievable for ${level}

      3. Answer Options:
         - All options must use ${level}-appropriate language
         - Distractors should be plausible but clearly incorrect
         - Avoid options that are too complex or too simple for ${level}
         - Keep all options at similar length and structure

      Format the response as a JSON object with this structure:
      {
        "questions": [
          {
            "text": "Question text here",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "correctAnswer": "A) option1"
          }
        ]
      }

      Critical Reminders:
      - STRICTLY maintain ${level} level language throughout
      - Do NOT use vocabulary or grammar above ${level} level
      - Keep questions clear and unambiguous for ${level} learners
      - Focus on testing understanding while respecting language level limits
    `;

    const questionsResponse = await axios.post(OPENAI_CHAT_URL, {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: questionPrompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const questionsData = JSON.parse(questionsResponse.data.choices[0].message.content);
    res.json({ questions: questionsData.questions });

  } catch (error) {
    console.error('Question generation error:', error);
    // Daha detaylı hata mesajı
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse questions data',
        details: 'The response format was invalid'
      });
    }
    res.status(500).json({
      error: 'Question generation failed',
      details: error.response?.data || error.message
    });
  }
});

// Hata yönetimi
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/generate-image');
  console.log('- POST /api/generate-questions');
  console.log('- GET /test');
}); 

// Hata yakalama
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
}); 