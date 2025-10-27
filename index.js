const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Render sets this environment variable for the port
const PORT = process.env.PORT || 3001; 

// Get your secret key from Render's environment variables
const HUGGING_FACE_API_KEY = process.env.HF_API_KEY;

// Get your frontend's URL from Render's environment variables
const FRONTEND_URL = process.env.CORS_ORIGIN;

if (!HUGGING_FACE_API_KEY || !FRONTEND_URL) {
  console.error("Missing environment variables: HF_API_KEY or CORS_ORIGIN");
  process.exit(1); // Stop the server if keys are missing
}

// 1. Setup CORS
// This is critical for security. It only allows your website to call this API.
app.use(cors({
  origin: FRONTEND_URL 
}));

// 2. Setup Middleware
// This allows your server to read the JSON data sent from your script.js
app.use(express.json());

// 3. Define the API Endpoint
// Your script.js will send its request to this URL (e.g., https://my-backend.onrender.com/api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    // Get the user's message from the request
    const { chatInput } = req.body;

    if (!chatInput) {
      return res.status(400).json({ error: 'Missing chatInput' });
    }

    // Call Hugging Face API
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [{ role: "user", content: chatInput }]
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Send the AI's response back to your frontend
    const aiMessage = response.data.choices[0].message.content;
    res.json({
      responseMessage: aiMessage 
    });

  } catch (error) {
    console.error("Error calling Hugging Face:", error.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// 4. Start the Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
