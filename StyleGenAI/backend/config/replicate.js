const Replicate = require('replicate');

// Initialize Replicate client
let replicate = null;

const initializeReplicate = () => {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('⚠️  Replicate API token not found');
      console.log('💡 To enable AI generation:');
      console.log('   1. Get an API token from https://replicate.com/account/api-tokens');
      console.log('   2. Set REPLICATE_API_TOKEN in your .env file');
      return null;
    }

    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('🤖 Replicate AI client initialized successfully');
    return replicate;
  } catch (error) {
    console.error('❌ Replicate initialization failed:', error.message);
    return null;
  }
};

// Available fashion/image generation models on Replicate
const FASHION_MODELS = {
  // Stable Diffusion XL for high-quality fashion images
  'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  
  // Stable Diffusion 1.5 for general image generation
  'sd15': 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
  
  // FLUX for artistic fashion designs
  'flux': 'black-forest-labs/flux-schnell:bf2f2e683d03a9549f484a37a0df1581e0b0b3b2c7d15028b982f5532dfb9e56',
  
  // Playground v2.5 for creative designs
  'playground': 'playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24'
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

// Generate design using Replicate
const generateDesign = async (preferences, modelType = 'sdxl') => {
  try {
    if (!replicate) {
      throw new Error('Replicate client not initialized. Please check your API token.');
    }

    const prompt = generateFashionPrompt(preferences);
    const modelVersion = FASHION_MODELS[modelType] || FASHION_MODELS.sdxl;
    
    console.log('🎨 Generating design with Replicate...');
    console.log('📝 Prompt:', prompt);
    console.log('🤖 Model:', modelType);

    const startTime = Date.now();

    // Different input formats for different models
    let input;
    if (modelType === 'flux') {
      input = {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80
      };
    } else if (modelType === 'playground') {
      input = {
        prompt: prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        guidance_scale: 7,
        num_inference_steps: 50
      };
    } else {
      // Default for SDXL and SD1.5
      input = {
        prompt: prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        scheduler: "K_EULER"
      };
    }

    const output = await replicate.run(modelVersion, { input });

    const generationTime = Date.now() - startTime;

    if (!output || (Array.isArray(output) && output.length === 0)) {
      throw new Error('No images generated');
    }

    // Handle different output formats
    const imageUrl = Array.isArray(output) ? output[0] : output;

    return {
      success: true,
      image: {
        url: imageUrl,
        originalPrompt: prompt
      },
      metadata: {
        model: modelType,
        modelVersion: modelVersion,
        size: '1024x1024',
        generationTime: generationTime,
        cost: 0 // Replicate has free tier
      }
    };

  } catch (error) {
    console.error('❌ Design generation failed:', error.message);
    
    // Handle specific Replicate errors
    if (error.message.includes('authentication')) {
      throw new Error('Invalid Replicate API token. Please check your configuration.');
    } else if (error.message.includes('quota')) {
      throw new Error('Replicate API quota exceeded. Please check your account.');
    } else if (error.message.includes('content')) {
      throw new Error('The design request violates content policy. Please try different preferences.');
    } else if (error.message.includes('402') || error.message.includes('Billing required')) {
      throw new Error('Replicate billing required. Please set up billing at https://replicate.com/account/billing to generate designs.');
    }
    
    throw new Error(`Design generation failed: ${error.message}`);
  }
};

// Generate multiple design variations
const generateDesignVariations = async (preferences, count = 1, modelType = 'sdxl') => {
  try {
    if (!replicate) {
      throw new Error('Replicate client not initialized');
    }

    const designs = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const design = await generateDesign(preferences, modelType);
        designs.push(design);
        
        // Add small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        errors.push(error.message);
      }
    }

    return {
      success: designs.length > 0,
      designs,
      errors: errors.length > 0 ? errors : undefined,
      totalGenerated: designs.length,
      totalRequested: count
    };

  } catch (error) {
    throw new Error(`Batch generation failed: ${error.message}`);
  }
};

// Test Replicate connection
const testConnection = async () => {
  try {
    if (!replicate) {
      return { success: false, error: 'Replicate client not initialized' };
    }

    // Test with a simple prediction
    const testModel = FASHION_MODELS.sdxl;
    const testInput = {
      prompt: "A simple red dress, fashion illustration",
      width: 512,
      height: 512,
      num_outputs: 1,
      num_inference_steps: 20
    };

    console.log('🧪 Testing Replicate connection...');
    const output = await replicate.run(testModel, { input: testInput });
    
    return {
      success: true,
      message: 'Replicate connection successful',
      testOutput: Array.isArray(output) ? output[0] : output
    };
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
    version: FASHION_MODELS[key],
    description: getModelDescription(key)
  }));
};

const getModelDescription = (modelType) => {
  const descriptions = {
    'sdxl': 'Stable Diffusion XL - High quality, detailed fashion designs',
    'sd15': 'Stable Diffusion 1.5 - Fast, reliable fashion generation',
    'flux': 'FLUX Schnell - Artistic and creative fashion designs',
    'playground': 'Playground v2.5 - Creative and aesthetic designs'
  };
  return descriptions[modelType] || 'Fashion design generation model';
};

module.exports = {
  initializeReplicate,
  generateDesign,
  generateDesignVariations,
  generateFashionPrompt,
  testConnection,
  getAvailableModels,
  FASHION_MODELS,
  getClient: () => replicate
};
