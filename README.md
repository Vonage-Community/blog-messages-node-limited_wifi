# Access LLMs Over Limited In-Flight Wi-Fi

This project demonstrates how to use the Vonage API Messages API to send and receive WhatsApp messages, while integrating Google's Gemini generative AI to process incoming messages and generate responses. The goal is to enable users to communicate with a chatbot via WhatsApp over a potentially limited network, such as in-flight Wi-Fi.

The code uses Vonage's messaging service and Google's Gemini model to provide dynamic responses to WhatsApp users.


This project was created as part of a blog post on the [Vonage API Developer blog](https://developer.vonage.com/en/blog).

## Prerequisites

Before you can run this project, make sure you have the following:

- Node.js (v14 or later)
- Google Gemini API Key - You'll need to create a Google Cloud project and get an API key for access to the Gemini generative AI model.
- Vonage API Key & Secret - Set up a Vonage account and get the API credentials to send WhatsApp messages via their messaging API.

## Installation

1. Clone this repository and Install the necessary dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the project directory and add your credentials:

   ```dotenv
   VONAGE_API_KEY=your_vonage_api_key
   VONAGE_API_SECRET=your_vonage_api_secret
   VONAGE_WHATSAPP_NUMBER=your_vonage_whatsapp_number
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. Start the server:

   ```bash
   node index.js
   ```

   The server will start and listen on `PORT=8000` by default. You can specify a different port by setting the `PORT` environment variable.

## How It Works

1. Incoming WhatsApp Message: 
   - A user sends a WhatsApp message to your Vonage WhatsApp number.
   - The Vonage API forwards the incoming message to your server at the `/inbound` endpoint.

2. Generative AI Response:
   - When receiving the message, the server queries Google's Gemini model to generate an appropriate response.
   
3. Sending the Response:
   - The server sends the AI-generated response back to the user via the Vonage API.

4. Error Handling:
   - If an error occurs during processing, the server responds with a fallback message.

