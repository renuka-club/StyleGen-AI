const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testDatabaseOperations() {
  console.log('🧪 Testing StyleGen AI Database Operations...\n');

  try {
    // Test 1: Generate a design (this should save to database)
    console.log('1️⃣ Testing Design Generation...');
    const designResponse = await axios.post(`${BASE_URL}/designs/generate`, {
      gender: 'female',
      occasion: 'casual',
      style: 'modern',
      colors: ['blue', 'white'],
      patterns: ['solid'],
      materials: ['cotton'],
      mood: 'confident',
      season: 'summer',
      customPrompt: 'A stylish summer outfit for a confident woman'
    });

    if (designResponse.data.success) {
      console.log('✅ Design generated successfully!');
      console.log(`   Design ID: ${designResponse.data.design.id}`);
      console.log(`   Title: ${designResponse.data.design.title}`);
      console.log(`   Status: ${designResponse.data.design.status}`);
      
      const designId = designResponse.data.design.id;

      // Test 2: Submit feedback for the design
      console.log('\n2️⃣ Testing Feedback Submission...');
      const feedbackResponse = await axios.post(`${BASE_URL}/designs/${designId}/feedback`, {
        rating: 5,
        comment: 'Amazing design! Love the color combination.',
        feedbackType: 'design_quality',
        tags: ['colors', 'style'],
        helpful: true
      });

      if (feedbackResponse.data.success) {
        console.log('✅ Feedback submitted successfully!');
        console.log(`   Feedback ID: ${feedbackResponse.data.data.feedback._id}`);
        console.log(`   Rating: ${feedbackResponse.data.data.feedback.rating}/5`);
        console.log(`   Average Rating: ${feedbackResponse.data.data.stats.averageRating}`);
      }

      // Test 3: Get feedback for the design
      console.log('\n3️⃣ Testing Feedback Retrieval...');
      const getFeedbackResponse = await axios.get(`${BASE_URL}/designs/${designId}/feedback`);
      
      if (getFeedbackResponse.data.success) {
        console.log('✅ Feedback retrieved successfully!');
        console.log(`   Total Feedbacks: ${getFeedbackResponse.data.data.stats.totalFeedbacks}`);
        console.log(`   Average Rating: ${getFeedbackResponse.data.data.stats.averageRating}`);
        console.log(`   Positive Count: ${getFeedbackResponse.data.data.stats.positiveCount}`);
      }

      // Test 4: Get all designs from database
      console.log('\n4️⃣ Testing Design Retrieval...');
      const getDesignsResponse = await axios.get(`${BASE_URL}/designs/demo`);
      
      if (getDesignsResponse.data.success) {
        console.log('✅ Designs retrieved successfully!');
        console.log(`   Total Designs: ${getDesignsResponse.data.pagination.total}`);
        console.log(`   Designs in Database: ${getDesignsResponse.data.designs.length}`);
        
        if (getDesignsResponse.data.designs.length > 0) {
          const firstDesign = getDesignsResponse.data.designs[0];
          console.log(`   Latest Design: ${firstDesign.title} (${firstDesign.status})`);
        }
      }

    } else {
      console.log('❌ Design generation failed:', designResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }

  console.log('\n🏁 Database testing completed!');
}

// Run the test
testDatabaseOperations();
