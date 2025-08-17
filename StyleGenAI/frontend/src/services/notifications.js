// Simple toast notification system
export const showNotification = (message, type = 'success', duration = 3000) => {
  // Remove any existing notifications
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`;
  
  // Set colors based on type
  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };
  
  toast.className += ` ${colors[type] || colors.success}`;
  
  // Set content
  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="flex items-center">
      <span class="mr-2">${icon[type] || icon.success}</span>
      <span>${message}</span>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
};

export const showDownloadSuccess = (filename, type = 'image') => {
  const typeNames = {
    image: 'Image',
    pdf: 'PDF',
    'tech-pack': 'Tech Pack',
    json: 'Data'
  };
  
  showNotification(
    `${typeNames[type] || 'File'} downloaded successfully: ${filename}`,
    'success',
    4000
  );
};

export const showDownloadError = (error, type = 'image') => {
  const typeNames = {
    image: 'Image',
    pdf: 'PDF',
    'tech-pack': 'Tech Pack',
    json: 'Data'
  };
  
  showNotification(
    `${typeNames[type] || 'File'} download failed: ${error}`,
    'error',
    5000
  );
};
