const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const pdf = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF files and text files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'text/plain' ||
        file.originalname.toLowerCase().endsWith('.pdf') ||
        file.originalname.toLowerCase().endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'), false);
    }
  }
});

// Helper function to load uploaded documents metadata
const loadDocuments = async () => {
  try {
    const docsFile = './data/uploaded_documents.json';
    const exists = await fs.pathExists(docsFile);
    if (!exists) {
      await fs.outputJson(docsFile, []);
      return [];
    }
    return await fs.readJson(docsFile);
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

// Helper function to save documents metadata
const saveDocuments = async (documents) => {
  try {
    const docsFile = './data/uploaded_documents.json';
    await fs.outputJson(docsFile, documents, { spaces: 2 });
  } catch (error) {
    console.error('Error saving documents:', error);
    throw error;
  }
};

// Helper function to extract text from PDF
const extractPDFText = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Helper function to extract text from text file
const extractTextFile = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
};

// POST /upload
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const { userEmail } = req.body;
    console.log(`📄 Processing ${req.files.length} uploaded file(s)`);
    console.log(`👤 User: ${userEmail}`);

    const processedFiles = [];
    const errors = [];

    // Process each file
    for (const file of req.files) {
      try {
        console.log(`📄 Processing file: ${file.originalname}`);
        
        let extractedText = '';
        const filePath = file.path;

        // Extract text based on file type
        if (file.mimetype === 'application/pdf' || 
            file.originalname.toLowerCase().endsWith('.pdf')) {
          extractedText = await extractPDFText(filePath);
        } else if (file.mimetype === 'text/plain' || 
                   file.originalname.toLowerCase().endsWith('.txt')) {
          extractedText = await extractTextFile(filePath);
        }

        if (!extractedText.trim()) {
          throw new Error('No text content found in the file');
        }

        console.log(`✅ Text extracted from ${file.originalname}: ${extractedText.length} characters`);

        // Save document metadata
        const documents = await loadDocuments();
        
        const documentData = {
          id: uuidv4(),
          filename: file.originalname,
          filePath: filePath,
          userEmail: userEmail,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          textLength: extractedText.length,
          processed: true
        };

        documents.push(documentData);
        await saveDocuments(documents);

        // Save extracted text for future queries
        const textFile = `./data/extracted_text_${documentData.id}.txt`;
        await fs.writeFile(textFile, extractedText, 'utf8');

        processedFiles.push({
          id: documentData.id,
          filename: documentData.filename,
          textLength: extractedText.length,
          uploadedAt: documentData.uploadedAt
        });

        console.log(`💾 Document saved with ID: ${documentData.id}`);

      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError);
        
        // Clean up file
        try {
          await fs.remove(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }

        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    // Return results
    if (processedFiles.length === 0) {
      return res.status(400).json({
        error: 'No files could be processed',
        errors: errors
      });
    }

    res.json({
      message: `${processedFiles.length} file(s) uploaded and processed successfully`,
      processedFiles: processedFiles,
      errors: errors.length > 0 ? errors : undefined,
      success: true
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up any uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.remove(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    res.status(500).json({
      error: 'Upload processing failed',
      message: error.message
    });
  }
});

// GET /documents
router.get('/documents', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    const documents = await loadDocuments();
    let userDocuments = documents;

    if (userEmail) {
      userDocuments = documents.filter(doc => doc.userEmail === userEmail);
    }

    // Sort by upload date (newest first)
    userDocuments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({
      documents: userDocuments.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        fileSize: doc.fileSize,
        textLength: doc.textLength,
        processed: doc.processed
      })),
      total: userDocuments.length
    });

    console.log(`📚 Retrieved ${userDocuments.length} documents for user: ${userEmail || 'all'}`);
  } catch (error) {
    console.error('❌ Error getting documents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /document/:id/text
router.get('/document/:id/text', async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await loadDocuments();
    const document = documents.find(doc => doc.id === id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const textFile = `./data/extracted_text_${id}.txt`;
    const exists = await fs.pathExists(textFile);

    if (!exists) {
      return res.status(404).json({
        error: 'Document text not found'
      });
    }

    const text = await fs.readFile(textFile, 'utf8');

    res.json({
      document: {
        id: document.id,
        filename: document.filename,
        uploadedAt: document.uploadedAt
      },
      text,
      textLength: text.length
    });

    console.log(`📖 Retrieved text for document: ${document.filename}`);
  } catch (error) {
    console.error('❌ Error getting document text:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// DELETE /document/:id
router.delete('/document/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const documents = await loadDocuments();
    const documentIndex = documents.findIndex(doc => doc.id === id);

    if (documentIndex === -1) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const document = documents[documentIndex];

    // Check if user owns this document
    if (document.userEmail !== userEmail) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own documents'
      });
    }

    // Remove files
    try {
      await fs.remove(document.filePath);
      await fs.remove(`./data/extracted_text_${id}.txt`);
    } catch (fileError) {
      console.error('Error removing files:', fileError);
    }

    // Remove from database
    documents.splice(documentIndex, 1);
    await saveDocuments(documents);

    res.json({
      message: 'Document deleted successfully',
      deleted_document: {
        id: document.id,
        filename: document.filename
      }
    });

    console.log(`🗑️ Document deleted: ${document.filename}`);
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /query-documents
router.post('/query-documents', async (req, res) => {
  try {
    const { query, userEmail, documentIds = [] } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const documents = await loadDocuments();
    let relevantDocs = documents;

    // Filter by user
    if (userEmail) {
      relevantDocs = documents.filter(doc => doc.userEmail === userEmail);
    }

    // Filter by specific document IDs if provided
    if (documentIds.length > 0) {
      relevantDocs = relevantDocs.filter(doc => documentIds.includes(doc.id));
    }

    let combinedContext = '';
    const usedDocuments = [];

    // Extract text from relevant documents
    for (const doc of relevantDocs) {
      try {
        const textFile = `./data/extracted_text_${doc.id}.txt`;
        const exists = await fs.pathExists(textFile);
        
        if (exists) {
          const text = await fs.readFile(textFile, 'utf8');
          combinedContext += `\n\n--- From ${doc.filename} ---\n${text}`;
          usedDocuments.push({
            id: doc.id,
            filename: doc.filename,
            textLength: text.length
          });
        }
      } catch (error) {
        console.error(`Error reading document ${doc.id}:`, error);
      }
    }

    if (!combinedContext.trim()) {
      return res.status(404).json({
        error: 'No document content found',
        message: 'No accessible documents found for the query'
      });
    }

    res.json({
      context: combinedContext,
      documents_used: usedDocuments,
      total_documents: usedDocuments.length,
      context_length: combinedContext.length
    });

    console.log(`📊 Query context prepared from ${usedDocuments.length} documents`);
  } catch (error) {
    console.error('❌ Error querying documents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
