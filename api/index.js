import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { userDB, contactDB, initDatabase } from './db-postgres.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

initDatabase().catch(() => {})

const JWT_SECRET = (globalThis?.process?.env?.JWT_SECRET) || 'fallback-secret-please-set-jwt-secret-in-env';

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

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await userDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userDB.create(email, hashedPassword, name);

    const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: newUser.id, email, name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await userDB.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login', details: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await userDB.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await contactDB.findAllByUser(req.user.id);
    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const { name, phone, countryCode, email } = req.body;

    if (!name || !phone || !countryCode) {
      return res.status(400).json({ error: 'Name, phone, and country code are required' });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const newContact = await contactDB.create(
      req.user.id, 
      name, 
      phone, 
      countryCode,
      email && email.trim() ? email.trim() : null
    );

    res.status(201).json({ contact: newContact });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    const contact = await contactDB.findByIdAndUser(contactId, req.user.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contactDB.delete(contactId, req.user.id);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { name, phone, countryCode, email } = req.body;

    if (!name || !phone || !countryCode) {
      return res.status(400).json({ error: 'Name, phone, and country code are required' });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const contact = await contactDB.findByIdAndUser(contactId, req.user.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const updatedContact = await contactDB.update(
      contactId,
      req.user.id,
      name,
      phone,
      countryCode,
      email && email.trim() ? email.trim() : null
    );

    res.json({ contact: updatedContact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/contacts/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs must be a non-empty array' });
    }

    const validIds = contactIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid contact IDs provided' });
    }

    const result = await contactDB.bulkDelete(validIds, req.user.id);

    res.json({ 
      message: `${result.deletedCount} contact(s) deleted successfully`,
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds
    });
  } catch (error) {
    console.error('Bulk delete contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/contacts/bulk-create', authenticateToken, async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts must be a non-empty array' });
    }

    const validContacts = [];
    const errors = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      if (!contact.name || !contact.phone || !contact.countryCode) {
        errors.push(`Contact ${i + 1}: Name, phone, and country code are required`);
        continue;
      }

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

    const createdContacts = [];
    for (const contact of validContacts) {
      const newContact = await contactDB.create(
        req.user.id,
        contact.name,
        contact.phone,
        contact.countryCode,
        contact.email
      );
      createdContacts.push(newContact);
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

app.use('/api', router);

app.use((err, req, res, next) => {
  void next;
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message,
    details: (globalThis?.process?.env?.NODE_ENV === 'development') ? err.stack : undefined
  });
});

export default async function handler(req, res) {
  return app(req, res);
}
