// server.js
import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = 3000; // Or any port you prefer

app.use(express.json()); // Middleware to parse JSON request bodies

// Allow requests from the frontend origin (replace with your frontend URL in production)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // WARNING: Use a specific origin in production
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Endpoint to get AI suggestion
app.post('/ai-suggestion', async (req, res) => {
    const taskInput = req.body.taskInput;

    if (!taskInput) {
        return res.status(400).json({ error: 'Task input is required.' });
    }

    // Securely access the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment variables.");
        return res.status(500).json({ error: 'Server configuration error: API key not found.' });
    }

    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Or another suitable model

        // Construct the prompt for the AI
        const prompt = `Provide a concise suggestion or breakdown for the following task: "${taskInput}". Keep the suggestion brief and actionable.`;

        // Generate content from the model
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Send the AI suggestion back to the client
        res.json({ suggestion: text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Error generating AI suggestion.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});