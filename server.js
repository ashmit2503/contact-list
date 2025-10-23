import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const db = new Database('auth.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    country_code TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Add email column to existing contacts table if it doesn't exist
try {
  db.exec(`ALTER TABLE contacts ADD COLUMN email TEXT`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Added email column to contacts table');
  }
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    console.error('Migration error:', err.message);
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, hashedPassword, name);

    // Generate JWT
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, email, name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user endpoint
app.get('/api/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// Get all contacts for the authenticated user
app.get('/api/contacts', authenticateToken, (req, res) => {
  try {
    const contacts = db.prepare('SELECT id, name, phone, country_code, email, created_at FROM contacts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new contact
app.post('/api/contacts', authenticateToken, (req, res) => {
  try {
    const { name, phone, countryCode, email } = req.body;

    // Validation
    if (!name || !phone || !countryCode) {
      return res.status(400).json({ error: 'Name, phone, and country code are required' });
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Insert contact
    const result = db.prepare('INSERT INTO contacts (user_id, name, phone, country_code, email) VALUES (?, ?, ?, ?, ?)').run(
      req.user.id, 
      name, 
      phone, 
      countryCode,
      email && email.trim() ? email.trim() : null
    );

    const newContact = {
      id: result.lastInsertRowid,
      name,
      phone,
      countryCode,
      email: email && email.trim() ? email.trim() : null
    };

    res.status(201).json({ contact: newContact });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a contact
app.delete('/api/contacts/:id', authenticateToken, (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    // Verify the contact belongs to the user
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(contactId, req.user.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Delete the contact
    db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(contactId, req.user.id);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a contact
app.put('/api/contacts/:id', authenticateToken, (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { name, phone, countryCode, email } = req.body;

    // Validation
    if (!name || !phone || !countryCode) {
      return res.status(400).json({ error: 'Name, phone, and country code are required' });
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Verify the contact belongs to the user
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(contactId, req.user.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update the contact
    db.prepare(`
      UPDATE contacts
      SET name = ?, phone = ?, country_code = ?, email = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name,
      phone,
      countryCode,
      email && email.trim() ? email.trim() : null,
      contactId,
      req.user.id
    );

    // Fetch and return the updated contact
    const updatedContact = db.prepare(`
      SELECT id, name, phone, country_code, email, created_at
      FROM contacts
      WHERE id = ? AND user_id = ?
    `).get(contactId, req.user.id);

    res.json({ contact: updatedContact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk delete contacts
app.post('/api/contacts/bulk-delete', authenticateToken, (req, res) => {
  try {
    const { contactIds } = req.body;

    // Validation
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs must be a non-empty array' });
    }

    // Validate and coerce to integers
    const validIds = contactIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid contact IDs provided' });
    }

    // Create placeholders for SQL IN clause
    const placeholders = validIds.map(() => '?').join(', ');
    
    // Delete the contacts (only those belonging to the user)
    const stmt = db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders}) AND user_id = ?`);
    const result = stmt.run(...validIds, req.user.id);

    res.json({ 
      message: `${result.changes} contact(s) deleted successfully`,
      deletedCount: result.changes,
      deletedIds: validIds.slice(0, result.changes)
    });
  } catch (error) {
    console.error('Bulk delete contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk create contacts
app.post('/api/contacts/bulk-create', authenticateToken, (req, res) => {
  try {
    const { contacts } = req.body;

    // Validation
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts must be a non-empty array' });
    }

    // Validate each contact
    const validContacts = [];
    const errors = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      if (!contact.name || !contact.phone || !contact.countryCode) {
        errors.push(`Contact ${i + 1}: Name, phone, and country code are required`);
        continue;
      }

      // Validate email format if provided
      if (contact.email && contact.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email.trim())) {
          errors.push(`Contact ${i + 1} (${contact.name}): Invalid email format`);
          continue;
        }
      }

      validContacts.push({
        name: contact.name,
        phone: contact.phone,
        countryCode: contact.countryCode,
        email: contact.email && contact.email.trim() ? contact.email.trim() : null
      });
    }

    if (validContacts.length === 0) {
      return res.status(400).json({ 
        error: 'No valid contacts to import', 
        details: errors 
      });
    }

    // Create all contacts
    const createdContacts = [];
    const stmt = db.prepare('INSERT INTO contacts (user_id, name, phone, country_code, email) VALUES (?, ?, ?, ?, ?)');
    
    for (const contact of validContacts) {
      const result = stmt.run(
        req.user.id,
        contact.name,
        contact.phone,
        contact.countryCode,
        contact.email
      );
      
      createdContacts.push({
        id: result.lastInsertRowid,
        name: contact.name,
        phone: contact.phone,
        country_code: contact.countryCode,
        email: contact.email
      });
    }

    res.status(201).json({ 
      message: `${createdContacts.length} contact(s) imported successfully`,
      contacts: createdContacts,
      importedCount: createdContacts.length,
      skippedCount: contacts.length - validContacts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
