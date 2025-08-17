const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// API client class
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('Making API request to:', url);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('URL was:', url);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Design API methods
export const designsApi = {
  // Generate a new design
  generateDesign: async (preferences) => {
    return apiClient.post('/designs/generate', preferences);
  },

  // Get user's designs
  getDesigns: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/designs?${queryString}` : '/designs';
    return apiClient.get(endpoint);
  },

  // Get specific design
  getDesign: async (id) => {
    return apiClient.get(`/designs/${id}`);
  },

  // Toggle favorite
  toggleFavorite: async (id) => {
    return apiClient.post(`/designs/${id}/favorite`);
  },

  // Track download
  trackDownload: async (id) => {
    return apiClient.post(`/designs/${id}/download`);
  },

  // Get public gallery
  getPublicGallery: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/designs/public/gallery?${queryString}` : '/designs/public/gallery';
    return apiClient.get(endpoint);
  },

  // Test Replicate AI connection
  testReplicate: async () => {
    return apiClient.get('/designs/test/replicate');
  },

  // Get available AI models
  getModels: async () => {
    return apiClient.get('/designs/models');
  }
};

// Auth API methods
export const authApi = {
  // Verify Firebase token
  verifyToken: async (token) => {
    apiClient.setToken(token);
    return apiClient.post('/auth/verify');
  },

  // Get user profile
  getProfile: async () => {
    return apiClient.get('/auth/profile');
  },

  // Update profile
  updateProfile: async (data) => {
    return apiClient.put('/auth/profile', data);
  },

  // Get user stats
  getStats: async () => {
    return apiClient.get('/auth/stats');
  },

  // Refresh design limits
  refreshLimits: async () => {
    return apiClient.post('/auth/refresh-limits');
  }
};

// Feedback API methods
export const feedbackApi = {
  // Submit feedback for a design
  submitFeedback: async (designId, feedbackData) => {
    return apiClient.post(`/designs/${designId}/feedback`, feedbackData);
  },

  // Get feedback for a design
  getFeedback: async (designId, page = 1, limit = 10) => {
    return apiClient.get(`/designs/${designId}/feedback?page=${page}&limit=${limit}`);
  },

  // Get feedback statistics
  getStats: async (designId) => {
    return apiClient.get(`/designs/${designId}/feedback/stats`);
  },

  // Update feedback (for moderation)
  updateFeedback: async (feedbackId, updates) => {
    return apiClient.put(`/feedback/${feedbackId}`, updates);
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    return apiClient.delete(`/feedback/${feedbackId}`);
  },

  // Get analytics
  getAnalytics: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/feedback/analytics?${params.toString()}`);
  }
};

// Health check
export const healthApi = {
  check: async () => {
    return apiClient.get('/health');
  }
};

// Export the API client for direct use if needed
export { apiClient };

// Default export
export default {
  designs: designsApi,
  auth: authApi,
  feedback: feedbackApi,
  health: healthApi,
  setToken: (token) => apiClient.setToken(token)
};
