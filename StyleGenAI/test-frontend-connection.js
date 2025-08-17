// Quick test to verify frontend-backend connection
const testData = {
  gender: 'female',
  occasion: 'casual',
  style: 'modern',
  colors: ['blue', 'white'],
  patterns: ['solid'],
  materials: ['cotton'],
  mood: 'confident',
  season: 'summer'
};

fetch('http://localhost:5002/api/test')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend connection test:', data);
    
    // Test design generation
    return fetch('http://localhost:5002/api/designs/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Design generation test:', data.success ? 'SUCCESS' : 'FAILED');
    if (data.success) {
      console.log('   Design ID:', data.design.id);
      console.log('   Title:', data.design.title);
      console.log('   Status:', data.design.status);
    } else {
      console.log('   Error:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
