const axios = require('axios');
const jwt = require('jsonwebtoken');

// 🧩 Config
const WEBHOOK_ID = 'bcfb53c5-2197-4690-a9e8-f2bb6d84cdc5';
const BASE_URL = `https://chat.botpress.cloud/${WEBHOOK_ID}`;
const ENCRYPTION_KEY = 'your-encryption-key'; // set this in your Chat Integration config
const USER_ID = 'user123'; // Unique user ID (can be anything)

// 🔐 Create x-user-key JWT
const xUserKey = jwt.sign({ id: USER_ID }, ENCRYPTION_KEY, {
  algorithm: 'HS256'
});

let conversationId = null;

// 🧪 Step 1: Create a conversation
async function createConversation() {
  try {
    const res = await axios.post(`${BASE_URL}/conversations`, {}, {
      headers: {
        'x-user-key': xUserKey
      }
    });

    conversationId = res.data.id;
    console.log('🆕 Conversation created:', conversationId);
  } catch (error) {
    console.error('❌ Error creating conversation:', error.response?.data || error.message);
  }
}

// 💬 Step 2: Send a message
async function sendMessage(text) {
  try {
    const res = await axios.post(`${BASE_URL}/conversations/${conversationId}/messages`, {
      type: 'text',
      text
    }, {
      headers: {
        'x-user-key': xUserKey
      }
    });

    console.log('📨 Message sent:', text);
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
  }
}

// 📥 Step 3: Get messages (bot replies)
async function listMessages() {
  try {
    const res = await axios.get(`${BASE_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'x-user-key': xUserKey
      }
    });

    console.log('🤖 Bot replies:');
    res.data.forEach(msg => {
      console.log(`🗨️  [${msg.direction}] ${msg.payload.text}`);
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error.response?.data || error.message);
  }
}

// 🚀 Run the whole flow
(async () => {
  await createConversation();
  await sendMessage('Hello, Bot!');
  setTimeout(listMessages, 1500); // Wait for bot to respond
})();
