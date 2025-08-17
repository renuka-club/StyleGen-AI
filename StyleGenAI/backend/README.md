# StyleGen AI Backend - Error-Free Version

## 🎯 What's Fixed

This version of the StyleGen AI backend has been completely rewritten to eliminate common errors and provide a robust, production-ready experience.

### ✅ Fixed Issues:

1. **Port Conflicts**: Automatic port detection and retry logic
2. **API Timeouts**: 2-minute timeout with retry mechanism for Hugging Face API
3. **Memory Leaks**: Proper buffer handling and request cleanup
4. **Unhandled Errors**: Comprehensive error handling and graceful shutdown
5. **Input Validation**: Strict validation for all API endpoints
6. **Rate Limiting**: Built-in protection against API abuse
7. **Environment Validation**: Startup checks for required variables

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
# Windows
start.bat

# The script will:
# - Check Node.js installation
# - Verify .env file exists
# - Install dependencies if needed
# - Start the server with proper error handling
```

### Option 2: Manual Start
```bash
node simple.js
```

## 🔧 Configuration

### Required Environment Variables (.env file):
```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Hugging Face AI Configuration (Required)
HUGGINGFACE_API_TOKEN=your_token_here

# Optional
FRONTEND_URL=http://localhost:5174
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Test Connection
```
GET /api/test
```

### Available Models
```
GET /api/designs/models
```

### Generate Design
```
POST /api/designs/generate
Content-Type: application/json

{
  "gender": "unisex",        // male, female, unisex
  "occasion": "casual",      // casual, formal, party, business, sport, wedding
  "style": "modern",         // modern, vintage, bohemian, minimalist, classic, trendy
  "colors": ["#FF6B6B", "#4ECDC4"]  // 1-5 hex colors
}
```

### Submit Feedback
```
POST /api/designs/:designId/feedback
Content-Type: application/json

{
  "rating": 5,               // 1-5
  "comment": "Great design!",
  "feedbackType": "general", // general, design_quality, etc.
  "tags": ["colors", "style"]
}
```

## 🛠️ Troubleshooting

### Common Issues & Solutions:

#### 1. Port Already in Use
**Error**: `EADDRINUSE: address already in use :::5002`
**Solution**: The server automatically finds the next available port

#### 2. Missing Environment Variables
**Error**: `Missing required environment variables: HUGGINGFACE_API_TOKEN`
**Solution**: Check your `.env` file and ensure all required variables are set

#### 3. Hugging Face API Errors
**Error**: `Hugging Face API error: 503`
**Solution**: The server automatically retries with exponential backoff

#### 4. Rate Limiting
**Error**: `Too many requests`
**Solution**: Wait 1 minute before making more requests (30 requests/minute limit)

#### 5. Invalid Input
**Error**: `Invalid gender/occasion/style`
**Solution**: Use only the allowed values listed in the API documentation

## 🔍 Monitoring

### Server Logs
The server provides detailed logging:
- ✅ Successful operations
- ❌ Errors with context
- 📝 Request logging
- 🔄 Retry attempts
- ⏰ Timeout warnings

### Health Monitoring
Check server status: `GET /api/health`

## 🚨 Error Recovery

The server includes automatic error recovery for:
- Network timeouts
- API rate limits
- Memory issues
- Port conflicts
- Invalid requests

## 💡 Performance Tips

1. **API Token**: Ensure your Hugging Face token has sufficient quota
2. **Network**: Stable internet connection recommended for AI generation
3. **Memory**: Server handles large image responses efficiently
4. **Concurrency**: Built-in rate limiting prevents overload

## 🔒 Security Features

- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS protection
- Error message sanitization
- Graceful shutdown handling

## 📞 Support

If you encounter any issues:
1. Check the server logs for detailed error messages
2. Verify your `.env` configuration
3. Ensure your Hugging Face API token is valid
4. Check network connectivity

The server is designed to be self-healing and should recover from most common issues automatically.
