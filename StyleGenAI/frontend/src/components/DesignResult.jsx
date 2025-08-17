import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../services/api';
import { showNotification } from '../services/notifications';

const DesignResult = ({ design, onBack, onDownload, onFavorite, onShare, isDownloading, downloadType }) => {
  const [rating, setRating] = useState(design.rating || 0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);

  // Available feedback tags
  const availableTags = [
    'colors', 'style', 'fit', 'creativity', 'accuracy', 'quality', 'other'
  ];

  // Load existing feedback on component mount
  useEffect(() => {
    if (design.id && !design.isDemo) {
      loadFeedback();
    }
  }, [design.id]);

  const loadFeedback = async () => {
    try {
      const response = await feedbackApi.getFeedback(design.id);
      if (response.success) {
        setExistingFeedbacks(response.data.feedbacks || []);
        setFeedbackStats(response.data.stats || null);
      }
    } catch (error) {
      console.warn('Could not load feedback:', error);
    }
  };

  const handleRating = (newRating) => {
    setRating(newRating);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      showNotification('Please select a rating before submitting feedback', 'warning');
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const feedbackData = {
        rating,
        comment: feedback.trim(),
        feedbackType: 'general',
        tags: selectedTags,
        helpful: rating >= 4
      };

      const response = await feedbackApi.submitFeedback(design.id, feedbackData);

      if (response.success) {
        setFeedbackSubmitted(true);
        showNotification('Thank you for your feedback!', 'success');

        // Reload feedback to show the new submission
        await loadFeedback();

        // Reset form
        setFeedback('');
        setSelectedTags([]);
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
      showNotification('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatGenerationTime = (time) => {
    if (!time) return 'Unknown';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="back-to-generator-btn flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300"
        >
          <span className="mr-3 text-lg">←</span>
          <span>Back to Generator</span>
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onFavorite(design.id)}
            className={`p-2 rounded-lg transition-colors ${
              design.isFavorited
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{design.isFavorited ? '❤️' : '🤍'}</span>
          </button>

          <button
            onClick={() => onShare(design)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">📤</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Design Image */}
        <div className="space-y-6">
          <div className="card">
            {design.isDemo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  🎨 This is a demo placeholder. Add your Replicate API token to generate real designs!
                </p>
              </div>
            )}
            
            <img
              src={design.imageUrl}
              alt={design.title || 'Generated Design'}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            
            {/* Download Button */}
            <div className="mt-4">
              <button
                onClick={() => onDownload(design, 'png')}
                disabled={isDownloading}
                className={`btn-primary w-full flex items-center justify-center download-btn transform hover:scale-105 transition-all duration-200 ${
                  isDownloading && downloadType === 'png' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isDownloading && downloadType === 'png' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📥</span>
                    Download Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generation Metadata */}
          {design.metadata && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2 text-primary-600">✨</span>
                Generation Details
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{design.metadata.model?.toUpperCase() || 'SDXL'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Generation Time:</span>
                  <span className="font-medium">
                    {formatGenerationTime(design.metadata.generationTime)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span className="font-medium">{design.metadata.size || '1024x1024'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality:</span>
                  <span className="font-medium">{design.metadata.quality || 'Standard'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Design Details */}
        <div className="space-y-6">
          {/* Design Info */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {design.title || 'AI Generated Design'}
            </h2>
            
            {design.prompt && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Design Prompt:</h3>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  {design.prompt}
                </p>
              </div>
            )}

            {/* Preferences Tags */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Style Preferences:</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                  {design.preferences.style}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {design.preferences.occasion}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {design.preferences.gender}
                </span>
                {design.preferences.mood && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {design.preferences.mood}
                  </span>
                )}
              </div>
            </div>

            {/* Color Palette */}
            {design.preferences.colors && design.preferences.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="mr-1">🎨</span>
                  Color Palette:
                </h3>
                <div className="flex gap-2">
                  {design.preferences.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-lg border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Design</h3>
            
            <div className="flex items-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`p-1 transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <span className="text-2xl">{star <= rating ? '⭐' : '☆'}</span>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💬</span>
              Share Your Feedback
            </h3>

            {feedbackSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm flex items-center">
                  <span className="mr-2">✅</span>
                  Thank you for your feedback! Your input helps us improve.
                </p>
              </div>
            ) : (
              <>
                {/* Feedback Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What aspects would you like to comment on? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-primary-100 text-primary-800 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Text */}
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What do you think about this design? Any suggestions for improvement?"
                  className="input-field resize-none h-24 mb-4"
                  maxLength={1000}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {feedback.length}/1000 characters
                  </span>

                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={rating === 0 || isSubmittingFeedback}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📝</span>
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Feedback Stats */}
            {feedbackStats && feedbackStats.totalFeedbacks > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Average Rating: {feedbackStats.averageRating.toFixed(1)} ⭐
                  </span>
                  <span>
                    {feedbackStats.totalFeedbacks} feedback{feedbackStats.totalFeedbacks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => onDownload(design, 'pdf')}
                disabled={isDownloading}
                className={`w-full btn-secondary flex items-center justify-center transform hover:scale-105 transition-all duration-200 ${
                  isDownloading && downloadType === 'pdf' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isDownloading && downloadType === 'pdf' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📄</span>
                    Download as PDF
                  </>
                )}
              </button>

              <button
                onClick={() => onDownload(design, 'tech-pack')}
                disabled={isDownloading}
                className={`w-full btn-secondary flex items-center justify-center transform hover:scale-105 transition-all duration-200 ${
                  isDownloading && downloadType === 'tech-pack' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isDownloading && downloadType === 'tech-pack' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Tech Pack...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📋</span>
                    Export Tech Pack
                  </>
                )}
              </button>

              <button
                onClick={() => onDownload(design, 'json')}
                disabled={isDownloading}
                className={`w-full btn-secondary flex items-center justify-center transform hover:scale-105 transition-all duration-200 ${
                  isDownloading && downloadType === 'json' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isDownloading && downloadType === 'json' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Exporting Data...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Export Data (JSON)
                  </>
                )}
              </button>

              <button
                onClick={() => window.open(design.imageUrl, '_blank')}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <span className="mr-2">🔗</span>
                Open Full Size
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignResult;
