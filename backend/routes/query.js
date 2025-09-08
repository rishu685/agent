const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to load chat history
const loadChatHistory = async (sessionId) => {
  try {
    const historyFile = `./data/chat_history_${sessionId}.json`;
    const exists = await fs.pathExists(historyFile);
    if (!exists) {
      return [];
    }
    return await fs.readJson(historyFile);
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

// Helper function to save chat history
const saveChatHistory = async (sessionId, history) => {
  try {
    const historyFile = `./data/chat_history_${sessionId}.json`;
    await fs.outputJson(historyFile, history, { spaces: 2 });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Helper function to load user documents and their content
const loadUserDocuments = async (userEmail) => {
  try {
    if (!userEmail) return null;
    
    const docsFile = './data/uploaded_documents.json';
    const exists = await fs.pathExists(docsFile);
    if (!exists) return null;
    
    const documents = await fs.readJson(docsFile);
    const userDocs = documents.filter(doc => doc.userEmail === userEmail);
    
    if (userDocs.length === 0) return null;
    
    // Load text content from all user documents
    let combinedText = '';
    for (const doc of userDocs) {
      try {
        const textFile = `./data/extracted_text_${doc.id}.txt`;
        const textExists = await fs.pathExists(textFile);
        if (textExists) {
          const text = await fs.readFile(textFile, 'utf8');
          combinedText += `\n\n--- Content from ${doc.filename} ---\n${text}`;
        }
      } catch (error) {
        console.error(`Error loading text for document ${doc.id}:`, error);
      }
    }
    
    return combinedText.trim() || null;
  } catch (error) {
    console.error('Error loading user documents:', error);
    return null;
  }
};

// POST /query
router.post('/query', async (req, res) => {
  try {
    const { query, sessionId = 'default', llmType = 'gemini', context = null, userEmail } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    console.log(`🤖 Processing query: "${query.substring(0, 50)}..."`);
    console.log(`📊 Session: ${sessionId}, LLM Type: ${llmType}, User: ${userEmail || 'anonymous'}`);

    // Load chat history
    const chatHistory = await loadChatHistory(sessionId);

    let response;
    let conversationContext = '';

    // Build conversation context from history
    if (chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-5); // Last 5 exchanges
      conversationContext = recentHistory.map(item => 
        `Human: ${item.query}\nAssistant: ${item.response}`
      ).join('\n\n');
    }

    // Load user documents automatically
    let documentContext = context;
    if (!documentContext && userEmail) {
      documentContext = await loadUserDocuments(userEmail);
      if (documentContext) {
        console.log(`📄 Found user documents: ${documentContext.length} characters`);
      }
    }

    // Add document context if available
    let fullPrompt = query;
    if (documentContext) {
      fullPrompt = `Context from uploaded documents:\n${documentContext}\n\nQuestion: ${query}`;
    }

    // Add conversation context
    if (conversationContext) {
      fullPrompt = `Previous conversation:\n${conversationContext}\n\nCurrent question: ${fullPrompt}`;
    }

    try {
      // Generate response using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      
      response = responseText;
      console.log(`✅ Gemini response generated (${responseText.length} chars)`);
      
    } catch (aiError) {
      console.error('❌ Gemini AI Error:', aiError);
      
      // Use fallback response but return 200 so frontend displays it
      response = "I'm experiencing technical difficulties with my AI service right now. This might be due to high demand on Google's servers. Please try again in a moment, or rephrase your question.";
      console.log(`⚠️ Using fallback response due to AI error`);
    }

    // Save to chat history
    const newEntry = {
      id: Date.now(),
      query,
      response,
      timestamp: new Date().toISOString(),
      sessionId,
      llmType,
      hasContext: !!context
    };

    chatHistory.push(newEntry);
    await saveChatHistory(sessionId, chatHistory);

    // Send response
    res.json({
      response,
      sessionId,
      timestamp: newEntry.timestamp,
      message: 'Query processed successfully'
    });

    console.log(`📝 Response saved to history (Session: ${sessionId})`);

  } catch (error) {
    console.error('❌ Error processing query:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /chat-history/:sessionId
router.get('/chat-history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 20 } = req.query;

    const chatHistory = await loadChatHistory(sessionId);
    const recentHistory = chatHistory.slice(-parseInt(limit));

    res.json({
      history: recentHistory,
      total: chatHistory.length,
      sessionId
    });

    console.log(`📚 Retrieved ${recentHistory.length} messages for session: ${sessionId}`);
  } catch (error) {
    console.error('❌ Error getting chat history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// DELETE /chat-history/:sessionId
router.delete('/chat-history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const historyFile = `./data/chat_history_${sessionId}.json`;
    const exists = await fs.pathExists(historyFile);
    
    if (exists) {
      await fs.remove(historyFile);
    }

    res.json({
      message: 'Chat history cleared successfully',
      sessionId
    });

    console.log(`🗑️ Chat history cleared for session: ${sessionId}`);
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /test-ai
router.post('/test-ai', async (req, res) => {
  try {
    console.log('🧪 Testing AI connection...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Hello! AI is working correctly.' and nothing else.");
    const response = result.response.text();

    res.json({
      success: true,
      response: response.trim(),
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    });

    console.log('✅ AI test successful');
  } catch (error) {
    console.error('❌ AI test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      model: 'gemini-1.5-flash'
    });
  }
});

module.exports = router;
