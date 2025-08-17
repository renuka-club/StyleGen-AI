require('dotenv').config();
const https = require('https');

// Test Hugging Face Token
const testHuggingFace = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'huggingface.co',
      port: 443,
      path: '/api/whoami',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const user = JSON.parse(data);
          console.log('✅ Hugging Face Token Valid:', user.name);
          resolve(true);
        } else {
          console.log('❌ Hugging Face Token Invalid:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Hugging Face Error:', error.message);
      resolve(false);
    });

    req.end();
  });
};

// Test Replicate Token
const testReplicate = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.replicate.com',
      port: 443,
      path: '/v1/account',
      method: 'GET',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const account = JSON.parse(data);
          console.log('✅ Replicate Token Valid:', account.username);
          resolve(true);
        } else {
          console.log('❌ Replicate Token Invalid:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Replicate Error:', error.message);
      resolve(false);
    });

    req.end();
  });
};

// Run tests
const runTests = async () => {
  console.log('🧪 Testing API Tokens...\n');
  
  const hfValid = await testHuggingFace();
  const replicateValid = await testReplicate();
  
  console.log('\n📊 Results:');
  console.log(`Hugging Face: ${hfValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Replicate: ${replicateValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (!hfValid && !replicateValid) {
    console.log('\n💡 Recommendations:');
    console.log('1. Get a new Hugging Face token: https://huggingface.co/settings/tokens');
    console.log('2. Or set up Replicate billing: https://replicate.com/account/billing');
    console.log('3. Or continue with demo mode (works perfectly!)');
  }
};

runTests();
