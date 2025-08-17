const https = require('https');

// Simple HTTP request function for Hugging Face API
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: {
            get: (name) => res.headers[name.toLowerCase()],
            'content-type': res.headers['content-type']
          },
          buffer: () => Promise.resolve(data),
          text: () => Promise.resolve(data.toString()),
          json: () => Promise.resolve(JSON.parse(data.toString()))
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
};

// Initialize Hugging Face client
let hfToken = null;

const initializeHuggingFace = () => {
  try {
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      console.log(' Hugging Face API token not found');
      console.log(' To enable AI generation:');
      console.log('   1. Get a free API token from https://huggingface.co/settings/tokens');
      console.log('   2. Set HUGGINGFACE_API_TOKEN in your .env file');
      return null;
    }

    hfToken = process.env.HUGGINGFACE_API_TOKEN;
    console.log('Hugging Face AI client initialized successfully (FREE!)');
    return true;
  } catch (error) {
    console.error('Hugging Face initialization failed:', error.message);
    return null;
  }
};

// Available fashion/image generation models on Hugging Face
const FASHION_MODELS = {
  // Stable Diffusion XL for high-quality fashion images
  'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
  
  // Stable Diffusion 2.1 for general image generation
  'sd21': 'stabilityai/stable-diffusion-2-1',
  
  // FLUX for artistic fashion designs
  'flux': 'black-forest-labs/FLUX.1-schnell',
  
  // Realistic Vision for photorealistic designs
  'realistic': 'SG161222/Realistic_Vision_V4.0'
};

// Generate fashion design prompt from user preferences
const generateFashionPrompt = (preferences) => {
  const {
    gender,
    occasion,
    style,
    colors,
    patterns = [],
    materials = [],
    mood = 'confident',
    season = 'all-season'
  } = preferences;

  // Base prompt for fashion design
  let prompt = `A professional fashion design illustration of a ${style} ${occasion} outfit for ${gender}, `;

  // Add colors
  if (colors && colors.length > 0) {
    const colorNames = colors.map(color => {
      // Convert hex colors to color names for better AI understanding
      const colorMap = {
        '#FF6B6B': 'coral red',
        '#4ECDC4': 'turquoise',
        '#45B7D1': 'sky blue',
        '#96CEB4': 'mint green',
        '#FFEAA7': 'golden yellow',
        '#DDA0DD': 'lavender',
        '#98D8C8': 'seafoam green',
        '#F7DC6F': 'pale yellow',
        '#BB8FCE': 'light purple',
        '#85C1E9': 'powder blue',
        '#F8C471': 'peach',
        '#82E0AA': 'light green',
        '#F1948A': 'salmon pink',
        '#A78BFA': 'violet purple',
        '#D7BDE2': 'pale lavender',
        '#000000': 'black',
        '#FFFFFF': 'white',
        '#808080': 'gray',
        '#8B4513': 'brown',
        '#2F4F4F': 'dark gray'
      };
      return colorMap[color] || color;
    });
    prompt += `featuring ${colorNames.join(' and ')} colors, `;
  }

  // Add patterns if specified
  if (patterns.length > 0) {
    prompt += `with ${patterns.join(' and ')} patterns, `;
  }

  // Add materials if specified
  if (materials.length > 0) {
    prompt += `made from ${materials.join(' and ')} materials, `;
  }

  // Add mood and style details
  const moodDescriptions = {
    confident: 'bold and empowering design',
    romantic: 'soft and feminine aesthetic',
    edgy: 'modern and rebellious style',
    comfortable: 'relaxed and casual feel',
    professional: 'polished and sophisticated look',
    playful: 'fun and creative design',
    sophisticated: 'elegant and refined appearance'
  };

  prompt += `with a ${moodDescriptions[mood] || 'stylish design'}. `;

  // Add seasonal considerations
  if (season !== 'all-season') {
    const seasonalDetails = {
      spring: 'perfect for mild spring weather with light layers',
      summer: 'ideal for warm weather with breathable fabrics',
      fall: 'suitable for cooler weather with cozy layers',
      winter: 'designed for cold weather with warm materials'
    };
    prompt += `${seasonalDetails[season]}. `;
  }

  // Technical specifications for better results
  prompt += `High-quality fashion illustration, clean professional presentation, fashion portfolio style, detailed clothing design, modern aesthetic, studio lighting, white background, full outfit view, fashion sketch style, detailed fabric textures, professional fashion photography style`;

  return prompt;
};

// Generate design using Hugging Face
const generateDesign = async (preferences, modelType = 'sdxl') => {
  try {
    if (!hfToken) {
      throw new Error('Hugging Face client not initialized. Please check your API token.');
    }

    const prompt = generateFashionPrompt(preferences);
    const modelId = FASHION_MODELS[modelType] || FASHION_MODELS.sdxl;
    
    console.log(' Generating design with Hugging Face...');
    console.log(' Prompt:', prompt);
    console.log(' Model:', modelType);

    const startTime = Date.now();

    // Hugging Face Inference API endpoint
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

    const response = await makeRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      if (response.status === 503) {
        throw new Error('Model is loading, please try again in a few minutes.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Hugging Face API error: ${response.status} ${errorText}`);
      }
    }

    const generationTime = Date.now() - startTime;

    // Check if response is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('image')) {
      const errorText = await response.text();
      throw new Error(`Expected image response, got: ${contentType}. Response: ${errorText}`);
    }

    // Convert image to base64 data URL
    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return {
      success: true,
      image: {
        url: imageUrl,
        originalPrompt: prompt
      },
      metadata: {
        model: modelType,
        modelId: modelId,
        size: '1024x1024',
        generationTime: generationTime,
        cost: 0 // Hugging Face is free!
      }
    };

  } catch (error) {
    console.error(' Design generation failed:', error.message);
    
    // Handle specific Hugging Face errors
    if (error.message.includes('authorization') || error.message.includes('401')) {
      throw new Error('Invalid Hugging Face API token. Please check your configuration.');
    } else if (error.message.includes('503')) {
      throw new Error('Model is loading. Please try again in 1-2 minutes.');
    } else if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    
    throw new Error(`Design generation failed: ${error.message}`);
  }
};

// Test Hugging Face connection
const testConnection = async () => {
  try {
    if (!hfToken) {
      return { success: false, error: 'Hugging Face client not initialized' };
    }

    // Test with a simple request to check token validity
    const testModel = FASHION_MODELS.sdxl;
    const testPrompt = "A simple red dress, fashion illustration";
    
    console.log(' Testing Hugging Face connection...');
    
    const response = await makeRequest(`https://api-inference.huggingface.co/models/${testModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: testPrompt,
        parameters: {
          num_inference_steps: 10,
          width: 512,
          height: 512
        }
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Hugging Face connection successful (FREE!)',
        model: testModel
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `Connection test failed: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get available models
const getAvailableModels = () => {
  return Object.keys(FASHION_MODELS).map(key => ({
    id: key,
    name: key.toUpperCase(),
    modelId: FASHION_MODELS[key],
    description: getModelDescription(key),
    provider: 'Hugging Face',
    cost: 'FREE'
  }));
};

const getModelDescription = (modelType) => {
  const descriptions = {
    'sdxl': 'Stable Diffusion XL - High quality, detailed fashion designs',
    'sd21': 'Stable Diffusion 2.1 - Fast, reliable fashion generation',
    'flux': 'FLUX Schnell - Artistic and creative fashion designs',
    'realistic': 'Realistic Vision - Photorealistic fashion designs'
  };
  return descriptions[modelType] || 'Fashion design generation model';
};

module.exports = {
  initializeHuggingFace,
  generateDesign,
  generateFashionPrompt,
  testConnection,
  getAvailableModels,
  FASHION_MODELS,
  getClient: () => ({ token: hfToken })
};
