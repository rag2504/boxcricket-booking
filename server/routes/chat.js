import express from 'express';
import Ground from '../models/Ground.js';
import Location from '../models/Location.js';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    // Fetch dynamic context from DB
    const grounds = await Ground.find({ status: 'active' }).select('name location price features policies').lean();
    const locations = await Location.find().select('name state popular').lean();

    const groundsContext = grounds.map(g => `- ${g.name} in ${g.location?.cityName}. Price: ${g.price?.perHour} ${g.price?.currency}/hr. Pitch: ${g.features?.pitchType || 'Standard'}`).join('\n');
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
      ...messages
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
      throw new Error(`Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process chat' });
  }
});

export default router;
