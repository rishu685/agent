const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();

const USERS_FILE = './data/users.json';

// Helper functions
const loadUsers = async () => {
  try {
    const exists = await fs.pathExists(USERS_FILE);
    if (!exists) {
      await fs.outputJson(USERS_FILE, []);
      return [];
    }
    return await fs.readJson(USERS_FILE);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

const saveUsers = async (users) => {
  try {
    await fs.outputJson(USERS_FILE, users, { spaces: 2 });
  } catch (error) {
    console.error('Error saving users:', error);
    throw error;
  }
};

// POST /signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'password']
      });
    }

    const users = await loadUsers();

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password, // Note: In production, hash the password
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);
    await saveUsers(users);

    // Return success (don't include password in response)
    const { password: _, ...userResponse } = newUser;
    
    res.status(201).json({
      message: 'User signed up successfully',
      user: userResponse
    });

    console.log(`✅ New user registered: ${email}`);
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    const users = await loadUsers();

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await saveUsers(users);

    // Return success (don't include password in response)
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email
      }
    });

    console.log(`✅ User logged in: ${email}`);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /users (for debugging - remove in production)
router.get('/users', async (req, res) => {
  try {
    const users = await loadUsers();
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({ users: safeUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
