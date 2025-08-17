import React, { useState } from 'react';

const DesignForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    gender: 'unisex',
    occasion: 'casual',
    style: 'modern',
    colors: [],
    patterns: [],
    materials: [],
    mood: 'confident',
    season: 'all-season',
    inspirationImage: null,
    customPrompt: ''
  });

  const [selectedColors, setSelectedColors] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const genderOptions = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'unisex', label: 'Unisex', icon: '👤' },
    { value: 'other', label: 'Other', icon: '🌈' }
  ];

  const occasionOptions = [
    { value: 'casual', label: 'Casual', icon: '👕' },
    { value: 'formal', label: 'Formal', icon: '👔' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'party', label: 'Party', icon: '🎉' },
    { value: 'wedding', label: 'Wedding', icon: '💒' },
    { value: 'vacation', label: 'Vacation', icon: '🏖️' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'date', label: 'Date', icon: '💕' }
  ];

  const styleOptions = [
    { value: 'vintage', label: 'Vintage', description: 'Classic retro styles' },
    { value: 'modern', label: 'Modern', description: 'Contemporary and sleek' },
    { value: 'bohemian', label: 'Bohemian', description: 'Free-spirited and artistic' },
    { value: 'minimalist', label: 'Minimalist', description: 'Clean and simple' },
    { value: 'streetwear', label: 'Streetwear', description: 'Urban and trendy' },
    { value: 'classic', label: 'Classic', description: 'Timeless elegance' },
    { value: 'trendy', label: 'Trendy', description: 'Latest fashion trends' },
    { value: 'elegant', label: 'Elegant', description: 'Sophisticated and refined' }
  ];

  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#A78BFA', '#D7BDE2',
    '#000000', '#FFFFFF', '#808080', '#8B4513', '#2F4F4F'
  ];

  const patternOptions = [
    'solid', 'stripes', 'floral', 'geometric', 'polka-dots', 
    'animal-print', 'abstract', 'plaid'
  ];

  const materialOptions = [
    'cotton', 'silk', 'wool', 'linen', 'polyester', 
    'denim', 'leather', 'chiffon', 'satin', 'velvet'
  ];

  const moodOptions = [
    { value: 'confident', label: 'Confident', emoji: '💪' },
    { value: 'romantic', label: 'Romantic', emoji: '💕' },
    { value: 'edgy', label: 'Edgy', emoji: '🔥' },
    { value: 'comfortable', label: 'Comfortable', emoji: '😌' },
    { value: 'professional', label: 'Professional', emoji: '💼' },
    { value: 'playful', label: 'Playful', emoji: '🎨' },
    { value: 'sophisticated', label: 'Sophisticated', emoji: '✨' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorSelect = (color) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color];
    
    setSelectedColors(newColors);
    handleInputChange('colors', newColors);
  };

  const handleArrayToggle = (field, value) => {
    const currentArray = formData[field];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleInputChange(field, newArray);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, inspirationImage: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
          Create Your Perfect Design
        </h1>
        <p className="text-lg text-gray-600">
          Tell us your style preferences and let AI create stunning fashion designs for you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gender Selection */}
        <div className="card">
          <div className="flex items-center mb-4">
            <span className="text-primary-600 mr-2 text-xl">👤</span>
            <h3 className="text-lg font-semibold text-gray-900">Gender</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('gender', option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.gender === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Occasion Selection */}
        <div className="card">
          <div className="flex items-center mb-4">
            <span className="text-primary-600 mr-2 text-xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-900">Occasion</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {occasionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('occasion', option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.occasion === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div className="card">
          <div className="flex items-center mb-4">
            <span className="text-primary-600 mr-2 text-xl">👕</span>
            <h3 className="text-lg font-semibold text-gray-900">Style</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {styleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('style', option.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  formData.style === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="card">
          <div className="flex items-center mb-4">
            <span className="text-primary-600 mr-2 text-xl">🎨</span>
            <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
            <span className="ml-2 text-sm text-gray-500">(Select up to 3)</span>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                disabled={selectedColors.length >= 3 && !selectedColors.includes(color)}
                className={`w-12 h-12 rounded-lg border-4 transition-all duration-200 ${
                  selectedColors.includes(color)
                    ? 'border-primary-500 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                } ${selectedColors.length >= 3 && !selectedColors.includes(color) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {selectedColors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedColors.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  {color}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading || selectedColors.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Design...
              </>
            ) : (
              <>
                <span className="mr-2">✨</span>
                Generate My Design
              </>
            )}
          </button>

          {selectedColors.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Please select at least one color to generate your design
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default DesignForm;
