/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe Lazy Initializer for Gemini
  let _ai: any = null;
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
       return null;
    }
    if (!_ai) {
      _ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return _ai;
  }

  // API Route: Personal Suggestions
  app.post('/api/suggestions', async (req, res) => {
    try {
      const { categories = [], vibes = [], maxPrice = 3000 } = req.body;

      // Log preferences
      console.log(`Analyzing interests: categories=[${categories}], vibes=[${vibes}], price<=₹${maxPrice}`);

      const ai = getGeminiClient();

      if (!ai) {
        // Safe Fallback Event Generator when Gemini Secret is not set
        console.log('Gemini API key is not configured. Serving high-fidelity simulated personalized suggestions in India.');
        
        // Generate pre-loaded mock suggestions depending on categories/vibes
        const simulatedAISuggestions = [
          {
            id: `ai-simulated-1`,
            title: `Artisanal Filter Coffee & Sitar Ambient Session`,
            description: `A customized cozy evening matching your interests. Listen to premium live local instrumental sitar melodies while sipping handcrafted filter coffee and ginger elixirs.`,
            category: categories.includes('Music') ? 'Music' : categories.includes('Food') ? 'Food' : 'Art',
            date: 'June 17, 2026',
            time: '6:00 PM - 9:00 PM',
            locationName: 'The Bangalore Filter House',
            city: 'Bengaluru',
            coordinates: { x: 45 + Math.random() * 10, y: 35 + Math.random() * 10 },
            price: Math.min(300, maxPrice),
            tags: ['Sitar', 'Filter Coffee', 'Chill', 'Aesthetic', ...vibes],
            image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop',
            organizer: 'Lofi Bengaluru Trust',
            popularity: 9.2,
            hasSeats: true
          },
          {
            id: `ai-simulated-2`,
            title: `Cyberpunk Hackathon & Indie Networking Hyderabad`,
            description: `A lively interactive hub matching your active vibes. Team up to design Indian customized procedural UI wrappers, spatial vectors, and network with leading start-up founders.`,
            category: categories.includes('Tech') ? 'Tech' : categories.includes('Comedy') ? 'Comedy' : 'Art',
            date: 'June 22, 2026',
            time: '7:30 PM - 11:00 PM',
            locationName: 'T-Hub Central Incubator',
            city: 'Hyderabad',
            coordinates: { x: 65 + Math.random() * 10, y: 55 + Math.random() * 10 },
            price: Math.min(150, maxPrice),
            tags: ['AI', 'Tech', 'Networking', 'Vibrant', ...vibes],
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
            organizer: 'T-Hub Emerging Circles',
            popularity: 9.4,
            hasSeats: false
          }
        ];

        return res.json({ suggestions: simulatedAISuggestions, generatedByAI: false });
      }

      // Dynamic Event suggestion using Gemini-3.5-flash
      const prompt = `
        We are an Indian local event discovery app "MetroHappenings".
        Generate exactly 3 creative, highly immersive, real-world of local events in India customized for a user with these interests:
        - Target Categories: ${categories.join(', ')} (Must categorize each under either 'Music', 'Food', 'Art', 'Tech', 'Sports', or 'Comedy')
        - Vibes/Moods requested: ${vibes.join(', ')}
        - Maximum Ticket Price in INR matches maximum: ₹${maxPrice}

        Rules for cities:
        - Must choose from: 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'

        Rules for coordinates:
        - Must provide "x" (longitude representation) and "y" (latitude representation) as integer values between 10 and 90, representing percentages of our canvas.

        Rules for descriptions:
        - Write exciting, detailed, punchy descriptions (2-3 sentences). Introduce custom naming and atmospheric sensory words.

        Rules for images:
        - Provide a highly relevant, high-resolution royalty-free photo URL from Unsplash. Or choose generic placeholders like "https://images.unsplash.com/photo-..." that match index topics.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an absolute local events mastermind. You generate beautiful, creative event agendas in Indian cities. Answer in strict JSON array representation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                locationName: { type: Type.STRING },
                city: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER }
                  },
                  required: ['x', 'y']
                },
                price: { type: Type.INTEGER },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                image: { type: Type.STRING },
                organizer: { type: Type.STRING },
                popularity: { type: Type.NUMBER },
                hasSeats: { type: Type.BOOLEAN }
              },
              required: [
                'id',
                'title',
                'description',
                'category',
                'date',
                'time',
                'locationName',
                'city',
                'coordinates',
                'price',
                'tags',
                'image',
                'organizer',
                'popularity',
                'hasSeats'
              ]
            }
          }
        }
      });

      const responseText = response.text || '[]';
      const parsedSuggestions = JSON.parse(responseText.trim());

      // Ensure IDs are tagged properly
      const processed = parsedSuggestions.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `ai-${Date.now()}-${idx}`
      }));

      res.json({ suggestions: processed, generatedByAI: true });

    } catch (error: any) {
      console.error('Gemini Suggestion Logic Error:', error);
      res.status(500).json({ error: error.message || 'Fail to fetch suggestions' });
    }
  });

  // API Route: Local Event Chat Concierge
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, chatHistory = [], interests = {} } = req.body;
      const ai = getGeminiClient();

      const userPreferencesText = interests.categories
        ? `The user is interested in these categories: ${interests.categories.join(', ')} and vibes: ${interests.vibes?.join(', ')}.`
        : '';

      if (!ai) {
        // Elegant Simulated response if Gemini offline
        const fallbackReplies = [
          `Hey there! I'd love to help you find the absolute best spot. Since I am running offline, checkout the **Neon Pulse electronic concert** or the **Sunset Rooftop Accoustic Showcase** - they match active, vibrant musical interests perfectly!`,
          `Great question! I highly recommend checking out **Street Food Bazaar** on Downtown Avenue. It's affordable ($15 entry) and has great outdoor chill vibes.`,
          `If you're in the mood for coding and networks, you have to attend the **AI DevCon 2026** at Silicon Summit Labs. Let me know if you need visual navigation or ticket buying support!`
        ];
        const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        return res.json({ reply: randomReply, generatedByAI: false });
      }

      // Call Gemini for smart event concierge helper
      const systemPrompt = `
        You are the "Metro Heights AI Concierge", a super friendly, deeply knowledgeable virtual companion.
        Your job is to recommend events happening in Metro Heights.
        ${userPreferencesText}
        Keep replies warm, highly readable (under 4-5 sentences), and pitch-perfect.
        Do not make up random events outside Metro Heights. Focus on events currently listed on our platform or suggest new ones aligned with our coordinates.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction: systemPrompt
        }
      });

      res.json({ reply: response.text || "I'm looking into it right now!", generatedByAI: true });

    } catch (error: any) {
      console.error('Chat Concierge Error:', error);
      res.json({ reply: 'I encountered a brief signal disruption. For now, check out the Riverside Electronic Fest happening this Friday!' });
    }
  });

  // Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve Vite in development, static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express application active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
