import express from 'express';
import Ground from '../models/Ground.js';
import Location from '../models/Location.js';
import fetch from 'node-fetch';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing from environment variables');
      return res.status(500).json({
        success: false,
        message: 'GROQ_API_KEY is not configured in the backend environment. Please add it to your Render Environment Variables.',
      });
    }

    // Fetch dynamic context from DB safely
    let grounds = [];
    let locations = [];
    try {
      grounds = await Ground.find({ status: 'active' }).select('name location price features policies').lean() || [];
      locations = await Location.find().select('name state popular').lean() || [];
    } catch (dbError) {
      console.error('⚠️ DB Context fetch warning:', dbError.message);
    }

    const groundsContext = grounds.map(g => `- ${g.name} in ${g.location?.cityName || 'Unknown'}. Price: ${g.price?.perHour || 'Contact Us'} ${g.price?.currency || 'INR'}/hr. Pitch: ${g.features?.pitchType || 'Turf'}`).join('\n');
    const locationsContext = locations.map(l => `- ${l.name}, ${l.state}`).join('\n');

    const systemPrompt = `You are the AI Assistant for CricBox, a premium box cricket ground booking platform.
Your goal is to help users with their queries about bookings, locations, grounds, and FAQs.
Be helpful, concise, and polite.

Here is the current live data from our database:
Available Grounds:
${groundsContext || 'No grounds currently listed.'}

Available Locations:
${locationsContext || 'No locations currently listed.'}

General Policies:
- Free cancellation up to 24 hours before booking.
- You can book up to 30 days in advance.
- Support email: support@boxcric.com

If a user specifically asks to talk to a human, a real agent, or an admin, or if you cannot solve their problem and need to escalate, reply clearly with the exact phrase: "TRANSFER_TO_HUMAN" and nothing else. This will trigger our live support system.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process chat: ' + error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

export default router;
