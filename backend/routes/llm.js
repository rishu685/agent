const express = require('express');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const LLMS_FILE = './data/saved_llms.json';

// Helper functions
const loadLLMs = async () => {
  try {
    const exists = await fs.pathExists(LLMS_FILE);
    if (!exists) {
      await fs.outputJson(LLMS_FILE, []);
      return [];
    }
    return await fs.readJson(LLMS_FILE);
  } catch (error) {
    console.error('Error loading LLMs:', error);
    return [];
  }
};

const saveLLMs = async (llms) => {
  try {
    await fs.outputJson(LLMS_FILE, llms, { spaces: 2 });
  } catch (error) {
    console.error('Error saving LLMs:', error);
    throw error;
  }
};

// GET /get-user-llms
router.get('/get-user-llms', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Email parameter is required'
      });
    }

    // Get saved LLMs for this user
    const savedLLMs = await loadLLMs();
    const userLLMs = savedLLMs.filter(llm => llm.email === email);

    // Default LLMs available to all users
    const defaultLLMs = [
      {
        id: 'gemini-1',
        name: 'Gemini Pro',
        type: 'gemini',
        created_at: new Date().toISOString(),
        description: 'Google Gemini AI model for general conversations'
      },
      {
        id: 'document-assistant',
        name: 'Document Assistant',
        type: 'rag',
        created_at: new Date().toISOString(),
        description: 'AI assistant for document analysis and Q&A'
      }
    ];

    // Combine default and user-specific LLMs
    const allLLMs = [...defaultLLMs, ...userLLMs];

    res.json({
      llms: allLLMs,
      total: allLLMs.length,
      user_created: userLLMs.length
    });

    console.log(`📋 Retrieved ${allLLMs.length} LLMs for user: ${email}`);
  } catch (error) {
    console.error('❌ Error getting user LLMs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /save-llm
router.post('/save-llm', async (req, res) => {
  try {
    const { llmName, userEmail, description, type = 'custom' } = req.body;

    // Validation
    if (!llmName) {
      return res.status(400).json({
        error: 'LLM name is required'
      });
    }

    console.log(`💾 Saving LLM: ${llmName} for user: ${userEmail}`);

    const savedLLMs = await loadLLMs();

    // Create new LLM entry
    const newLLM = {
      id: `llm_${uuidv4()}`,
      name: llmName,
      email: userEmail,
      description: description || `Custom AI assistant: ${llmName}`,
      type,
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      usage_count: 0
    };

    savedLLMs.push(newLLM);
    await saveLLMs(savedLLMs);

    res.status(201).json({
      message: 'LLM saved successfully',
      llm: newLLM
    });

    console.log(`✅ LLM saved successfully: ${newLLM.id}`);
  } catch (error) {
    console.error('❌ Error saving LLM:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /load-llm/:id
router.get('/load-llm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const savedLLMs = await loadLLMs();
    const llm = savedLLMs.find(l => l.id === id);

    if (!llm) {
      return res.status(404).json({
        error: 'LLM not found',
        message: `No LLM found with ID: ${id}`
      });
    }

    // Increment usage count
    llm.usage_count = (llm.usage_count || 0) + 1;
    llm.last_accessed = new Date().toISOString();
    await saveLLMs(savedLLMs);

    res.json({
      llm,
      message: 'LLM loaded successfully'
    });

    console.log(`📤 LLM loaded: ${id} (${llm.name})`);
  } catch (error) {
    console.error('❌ Error loading LLM:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// DELETE /delete-llm/:id
router.delete('/delete-llm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const savedLLMs = await loadLLMs();
    const llmIndex = savedLLMs.findIndex(l => l.id === id);

    if (llmIndex === -1) {
      return res.status(404).json({
        error: 'LLM not found'
      });
    }

    const llm = savedLLMs[llmIndex];

    // Check if user owns this LLM
    if (llm.email !== userEmail) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own LLMs'
      });
    }

    savedLLMs.splice(llmIndex, 1);
    await saveLLMs(savedLLMs);

    res.json({
      message: 'LLM deleted successfully',
      deleted_llm: llm
    });

    console.log(`🗑️ LLM deleted: ${id} (${llm.name})`);
  } catch (error) {
    console.error('❌ Error deleting LLM:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /llms (get all LLMs - admin endpoint)
router.get('/llms', async (req, res) => {
  try {
    const savedLLMs = await loadLLMs();
    res.json({
      llms: savedLLMs,
      total: savedLLMs.length
    });
  } catch (error) {
    console.error('❌ Error getting all LLMs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
