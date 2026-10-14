# AI Smart Agriculture System

*Research-Based AI Platform for Precision Agriculture and Farmer Decision Support*

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ai-smart-agriculture-system.onrender.com)
![Deployment](https://img.shields.io/badge/Deployment-Render-success)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933)
![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28)
![Gemini API](https://img.shields.io/badge/Gemini-API-4285F4)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

An integrated precision agriculture platform designed to assist farmers through AI-powered recommendations, disease diagnosis, weather intelligence, and market support.

## Features

- Crop Recommendation  
- Plant Disease Detection  
- Fertilizer Advisory  
- Weather Monitoring  
- Agricultural Marketplace  
- AI Chatbot Assistance  
- Market Price Analysis  

## Tech Stack

- React + TypeScript  
- Node.js + Express  
- Firebase  
- Gemini API  
- Tailwind CSS  

## System Architecture & Feature-First Directory Structure

The platform is structured with a modern **Feature-First Architecture** separating frontend and backend domains:

```text
AI-Smart-Agriculture-System/
├── backend/
│   └── src/
│       ├── core/                      # Core configuration, persistence, middlewares
│       │   ├── config.ts              # Env constants & fallback datasets
│       │   ├── db.ts                  # JSON file persistence helpers
│       │   └── middleware/            # Auth, rate-limiting, and upload middlewares
│       ├── features/                  # Feature-first backend domain modules
│       │   ├── auth/                  # Authentication & user profile endpoints
│       │   ├── fertilizer/            # Soil nutrient & fertilizer recommendations
│       │   ├── marketplace/           # Product CRUD & inventory endpoints
│       │   ├── history/               # Analysis activity persistence
│       │   ├── weather/               # OpenWeather & agro-meteorology endpoints
│       │   ├── market/                # Mandi price proxy with caching & fallback
│       │   └── chat/                  # AI assistant & diagnosis routing
│       ├── app.ts                     # Express app instance & route assembly
│       └── server.ts                  # HTTP listener & Vite dev integration
│
├── frontend/
│   ├── index.html                     # Frontend HTML entry
│   └── src/
│       ├── core/                      # Core providers & configuration (i18n, context, firebase)
│       ├── shared/                    # Reusable cross-feature UI components, hooks & utils
│       │   ├── components/            # Header, Navigation, Logo, LanguageSelector, ResultCard
│       │   ├── hooks/                 # useLocation
│       │   └── stores/                # uiStore
│       ├── features/                  # Feature-first frontend domain modules
│       │   ├── home/                  # Dashboard hero carousel & live command center
│       │   ├── crop-advisor/          # Soil analysis & crop recommendation
│       │   ├── disease-detection/     # Plant leaf disease scanning & remedies
│       │   ├── fertilizer/            # Fertilizer recommendation form & dosage guidance
│       │   ├── marketplace/           # Farmer marketplace & direct product trading
│       │   ├── weather/               # 5-day weather forecast & agricultural insights
│       │   ├── market-prices/         # Mandi price trends & historical analytics
│       │   ├── education/             # Agricultural learning center & article reader
│       │   ├── auth/                  # Login, profile setup & security settings
│       │   ├── history/               # Activity audit modal & record browsing
│       │   └── chat/                  # RAG-powered chatbot & AI agriculture assistance
│       ├── App.tsx                    # Clean master orchestrator
│       ├── main.tsx                   # React client entry point
│       └── index.css                  # Tailored theme & utility tokens
│
├── server.ts                          # Root entry delegating to backend
├── vite.config.ts                     # Fullstack Vite + Tailwind configuration
├── tsconfig.json                      # Unified TypeScript paths configuration
└── package.json                       # Scripts for unified run and build
```

## Research Motivation

Designed to support data-driven agricultural decision making by integrating crop advisory, disease diagnosis, market intelligence, and AI assistance into a unified precision agriculture platform.

## Workflow Overview

```text
Farmer Input Data
   ↓
AI Models & Recommendation Engine
   ↓
Crop / Disease / Fertilizer Predictions
   ↓
Decision Support for Farmers
```

## Screenshots

### Dashboard

<img width="245" height="145" alt="image" src="https://github.com/user-attachments/assets/2cfc1eb0-9487-44c1-8a28-37a4e68f82cc" />

### Crop Advisor

<img width="280" height="185" alt="image" src="https://github.com/user-attachments/assets/c77734a1-fd24-4360-8ce7-641cc9f5e952" />

### Disease Detection

<img width="257" height="157" alt="image" src="https://github.com/user-attachments/assets/85a1ff2f-0aa1-4f60-b653-23c43b1a3664" />

### Fertilizer Recommendation

<img width="260" height="149" alt="image" src="https://github.com/user-attachments/assets/1974c52b-d310-4b05-8f3b-a28e09da74b1" />

### Market Trends

<img width="255" height="145" alt="image" src="https://github.com/user-attachments/assets/a6289380-e443-4236-b168-a9166301eedd" />

### AI Chatbot

<img width="259" height="275" alt="image" src="https://github.com/user-attachments/assets/8356c211-e1a1-41b3-9d75-5a381e42b722" />

## Live Demo

https://ai-smart-agriculture-system.onrender.com

## Getting Started

### Prerequisites

- Node.js  
- Gemini API Key  
- Firebase Project Configuration  

## Installation

```bash
npm install
```

## Environment Setup

Create a local `.env` file and add:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

⚠️ Do not commit API keys to the repository. Use environment variables.

## Run Locally

```bash
npm run dev
```

## Key Modules

- AI-powered crop recommendation for precision farming decisions  
- Plant disease detection support for early diagnosis  
- Fertilizer recommendation using agricultural inputs  
- Weather-aware farming insights  
- Marketplace support for agricultural products  
- AI chatbot assistance using knowledge services  
- Market trend analysis for price-aware planning  

## Research Contribution

This repository presents a portfolio-grade implementation inspired by an IEEE-style research project in AI-driven agriculture, demonstrating practical integration of artificial intelligence for farmer-centric decision support systems.

## Repository Topics

```text
smart-agriculture
artificial-intelligence
precision-agriculture
machine-learning
crop-recommendation
plant-disease-detection
fertilizer-recommendation
market-analysis
react
typescript
firebase
nodejs
rag
agritech
```

## License

MIT License
