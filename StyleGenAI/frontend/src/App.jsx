import React, { useState, useEffect } from 'react';
import DesignForm from './components/DesignForm';
import DesignResult from './components/DesignResult';
import { designsApi, feedbackApi, apiClient } from './services/api';
import { downloadDesignAsPDF, downloadImageAsPNG, downloadDesignAsJSON } from './services/pdfService';
import { showDownloadSuccess, showDownloadError } from './services/notifications';

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState('');

  // Test backend connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing backend connection...');
        const response = await apiClient.get('/test');
        console.log('Connection test result:', response);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('failed');
        setError(`Backend connection failed: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  const handleDesignSubmit = async (formData) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('Design preferences:', formData);

      // Call the real API
      const response = await designsApi.generateDesign(formData);

      if (response.success) {
        setGeneratedDesign({
          id: response.design.id,
          title: response.design.title,
          imageUrl: response.design.images[0]?.url || 'https://via.placeholder.com/512x512/EC4899/FFFFFF?text=Design+Generated',
          prompt: response.design.aiGeneration?.prompt || `${formData.style} ${formData.occasion} outfit`,
          preferences: formData,
          metadata: response.design.aiGeneration,
          isFavorited: false
        });
      } else {
        throw new Error(response.message || 'Design generation failed');
      }

    } catch (error) {
      console.error('Design generation failed:', error);

      let errorMessage = error.message || 'Failed to generate design. Please try again.';
      let demoImageText = 'Demo+Design+(API+Error)';

      if (error.message && error.message.includes('billing')) {
        errorMessage = 'Replicate billing required. Please set up billing at replicate.com/account/billing to generate real designs.';
        demoImageText = 'Demo+Design+(Billing+Required)';
      }

      setError(errorMessage);

      // Show mock design for demo purposes when API fails
      setGeneratedDesign({
        id: Date.now(),
        title: 'Demo Fashion Design',
        imageUrl: `https://via.placeholder.com/512x512/EC4899/FFFFFF?text=${demoImageText}`,
        prompt: `${formData.style} ${formData.occasion} outfit for ${formData.gender} in ${formData.colors.join(', ')} colors`,
        preferences: formData,
        isDemo: true,
        isFavorited: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (design, format = 'png') => {
    try {
      setError(null);
      setIsDownloading(true);
      setDownloadType(format);

      if (design.isDemo && format === 'png') {
        // For demo image download, just open in new tab
        window.open(design.imageUrl, '_blank');
        return;
      }

      let result;
      switch (format) {
        case 'pdf':
          result = await downloadDesignAsPDF(design, 'design');
          break;
        case 'tech-pack':
          result = await downloadDesignAsPDF(design, 'tech-pack');
          break;
        case 'json':
          result = downloadDesignAsJSON(design);
          break;
        case 'png':
        case 'image':
        default:
          if (design.isDemo) {
            window.open(design.imageUrl, '_blank');
            return;
          }
          result = await downloadImageAsPNG(design);
          break;
      }

      if (!design.isDemo) {
        // Track download for real designs
        try {
          await designsApi.trackDownload(design.id);
        } catch (trackError) {
          console.warn('Failed to track download:', trackError);
        }
      }

      if (result && result.success) {
        console.log(`Download successful: ${result.filename}`);
        showDownloadSuccess(result.filename || 'File downloaded successfully', format);
      }

    } catch (error) {
      console.error('Download failed:', error);
      showDownloadError(error.message, format);
      setError(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadType('');
    }
  };

  const handleFavorite = async (designId) => {
    try {
      if (generatedDesign?.isDemo) {
        // For demo, just toggle locally
        setGeneratedDesign(prev => ({
          ...prev,
          isFavorited: !prev.isFavorited
        }));
        return;
      }

      await designsApi.toggleFavorite(designId);
      setGeneratedDesign(prev => ({
        ...prev,
        isFavorited: !prev.isFavorited
      }));

    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async (design) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: design.title || 'My AI Fashion Design',
          text: `Check out this amazing fashion design I created with StyleGen AI!`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleBack = () => {
    setGeneratedDesign(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-3xl">🎨</span>
                <span className="ml-2 text-2xl font-bold text-gray-900 font-display">
                  StyleGen AI
                </span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
                Generate
              </a>
              <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
                Gallery
              </a>
              <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
                About
              </a>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Connected' :
                 connectionStatus === 'failed' ? '🔴 Disconnected' :
                 '🟡 Testing...'}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto p-6 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Generation Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <p className="text-red-600 text-xs mt-2">
                  💡 To enable real AI generation, add your Replicate API token to the backend .env file
                </p>
              </div>
            </div>
          </div>
        )}

        {!generatedDesign ? (
          <DesignForm onSubmit={handleDesignSubmit} isLoading={isGenerating} />
        ) : (
          <DesignResult
            design={generatedDesign}
            onBack={handleBack}
            onDownload={handleDownload}
            onFavorite={handleFavorite}
            onShare={handleShare}
            isDownloading={isDownloading}
            downloadType={downloadType}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-primary-600 mr-2 text-xl">✨</span>
              <span className="text-lg font-semibold text-gray-900">
                Powered by Replicate AI Fashion Design
              </span>
            </div>
            <p className="text-gray-600">
              Create unique, personalized fashion designs with the power of artificial intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
