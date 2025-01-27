require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Function to send a message via Vonage
async function sendMessage(text, to_number) {
  try {
    const data = {
      from: { type: "whatsapp", number: process.env.VONAGE_WHATSAPP_NUMBER },
      to: { type: "whatsapp", number: to_number },
      message: { content: { type: "text", text } },
    };

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${process.env.VONAGE_API_KEY}:${process.env.VONAGE_API_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/json",
    };

    await axios.post("https://messages-sandbox.nexmo.com/v0.1/messages", data, {
      headers,
    });
    console.log("The message was successfully sent");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Function to get the response from the LLM (Gemini or any other model)
async function getLLMResponse(incomingMsgText) {
  try {
    // Query Gemini API with the message received
    const chatSession = model.startChat({
      history: [{ role: "user", parts: [{ text: incomingMsgText }] }],
    });

    const result = await chatSession.sendMessage(incomingMsgText);
    return result.response.text(); // Return the response text
  } catch (error) {
    console.error("There was an error querying LLM:", error);
    throw new Error("LLM query error");
  }
}

// Handle incoming message (Webhook from Vonage)
app.post("/inbound", async (req, res) => {
  const { text: incomingMsgText, from: requesterNumber } = req.body;
  console.log(`Received message from ${requesterNumber}: ${incomingMsgText}`);

  try {
    // Use the LLM function to get a response
    const llmResponse = await getLLMResponse(incomingMsgText);

    // Send the LLM response back to the user on WhatsApp
    await sendMessage(llmResponse, requesterNumber);
    res.status(200).send();
  } catch (error) {
    console.error("Error:", error);
    await sendMessage(
      "Apologies, something went wrong. Please try again.",
      requesterNumber
    );
    res.status(500).send();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
