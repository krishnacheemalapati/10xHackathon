# AI Video Call Platform

A cross-platform AI-powered video calling application that provides automated wellness checks with threat detection and emergency response capabilities.

## Features

- 🤖 AI-powered conversations using Cohere
- 📹 Real-time video calling with WebRTC
- 🔍 Computer vision threat detection
- 🚨 Automated emergency contact system
- 📱 Cross-platform (Web, iOS, Android)
- ⏰ Scheduled automated calls

## Project Structure

```
├── backend/          # Node.js API server
├── frontend-web/     # React web dashboard  
├── frontend-mobile/  # React Native/Expo mobile app
├── shared/          # Common types and utilities
└── infrastructure/  # Docker, CI/CD configs
```

## Quick Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies: `npm install` in each folder
3. Start development servers:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Web frontend
   cd frontend-web && npm start
   
   # Mobile frontend  
   cd frontend-mobile && npx expo start
   ```

## Environment Variables

All sensitive API keys are stored in `.env` files (not tracked in git).
See `.env.example` for required variables.

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Frontend**: React, React Native, Expo
- **AI**: Cohere API for conversations
- **Vision**: Google Cloud Vision API
- **Communication**: Twilio for calls/SMS
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel, Expo