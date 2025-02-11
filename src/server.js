require("dotenv").config();
const express = require("express");
const { Vonage } = require("@vonage/server-sdk");
const { WhatsAppText } = require('@vonage/messages');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { verifySignature } = require("@vonage/jwt");

const app = express();
const vonage = new Vonage(
  {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY,
  },
  {
    apiHost: "https://messages-sandbox.nexmo.com",
  }
);

const verifyJWT = (req) => {
  // Verify if the incoming message came from Vonage
  const jwtToken = req.headers.authorization.split(" ")[1];
  if(!verifySignature(jwtToken, process.env.VONAGE_API_SIGNATURE_SECRET)) {
    console.error("Unauthorized request");
    throw new Error('Not a messages API request');
  }

  console.log('JWT verified');
}

app.use(express.json());

const PORT = process.env.PORT || 8000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Function to send a message via Vonage
const sendMessage = async (text, to_number) => {
  try {

    const { messageUUID } = await vonage.messages.send(
      new WhatsAppText({
         from: process.env.VONAGE_WHATSAPP_NUMBER,
          to: to_number,
          text: text,
      }),
    );

    console.log(`The message was successfully sent with messageUUID: ${messageUUID}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Function to get the response from the LLM (Gemini or any other model)
const getLLMResponse = async (incomingMsgText) => {
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

  verifyJWT(req);

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

app.post('/status', (req, res) => {
  console.log(req.body);
  verifyJWT(req);

  console.log('Received status update');
  res.status(200).send();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
