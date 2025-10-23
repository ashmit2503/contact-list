import { sql } from '@vercel/postgres';

export async function initDatabase() {
  try {
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'contacts')
    `;

    const existingTables = tablesCheck.rows.map(row => row.table_name);
    
    if (!existingTables.includes('users')) {
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }

    if (!existingTables.includes('contacts')) {
      await sql`
        CREATE TABLE contacts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          country_code TEXT NOT NULL,
          email TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;
    }
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}


export const userDB = {
  async findByEmail(email) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      return result.rows[0];
    } catch (error) {
      if (error.message?.includes('relation "users" does not exist')) {
        await initDatabase();
        const retryResult = await sql`
          SELECT * FROM users WHERE email = ${email}
        `;
        return retryResult.rows[0];
      }
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  async create(email, hashedPassword, name) {
    try {
      const result = await sql`
        INSERT INTO users (email, password, name)
        VALUES (${email}, ${hashedPassword}, ${name})
        RETURNING id, email, name
      `;
      return result.rows[0];
    } catch (error) {
      if (error.message?.includes('relation "users" does not exist')) {
        await initDatabase();
        const retryResult = await sql`
          INSERT INTO users (email, password, name)
          VALUES (${email}, ${hashedPassword}, ${name})
          RETURNING id, email, name
        `;
        return retryResult.rows[0];
      }
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const result = await sql`
        SELECT id, email, name, created_at FROM users WHERE id = ${id}
      `;
      return result.rows[0];
    } catch (error) {
      if (error.message?.includes('relation "users" does not exist')) {
        await initDatabase();
        const retryResult = await sql`
          SELECT id, email, name, created_at FROM users WHERE id = ${id}
        `;
        return retryResult.rows[0];
      }
      console.error('Error finding user by id:', error);
      throw error;
    }
  }
};


export const contactDB = {
  async findAllByUser(userId) {
    const result = await sql`
      SELECT id, name, phone, country_code, email, created_at
      FROM contacts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async findByUserAndPhone(userId, phone) {
    const result = await sql`
      SELECT * FROM contacts
      WHERE user_id = ${userId} AND phone = ${phone}
    `;
    return result.rows[0];
  },

  async create(userId, name, phone, countryCode, email = null) {
    try {
      const result = await sql`
        INSERT INTO contacts (user_id, name, phone, country_code, email)
        VALUES (${userId}, ${name}, ${phone}, ${countryCode}, ${email})
        RETURNING id, name, phone, country_code, email
      `;
      return result.rows[0];
    } catch (error) {
      if (error.message?.includes('relation "contacts" does not exist')) {
        await initDatabase();
        const retryResult = await sql`
          INSERT INTO contacts (user_id, name, phone, country_code, email)
          VALUES (${userId}, ${name}, ${phone}, ${countryCode}, ${email})
          RETURNING id, name, phone, country_code, email
        `;
        return retryResult.rows[0];
      }
      throw error;
    }
  },

  async findByIdAndUser(contactId, userId) {
    const result = await sql`
      SELECT * FROM contacts
      WHERE id = ${contactId} AND user_id = ${userId}
    `;
    return result.rows[0];
  },

  async delete(contactId, userId) {
    await sql`
      DELETE FROM contacts
      WHERE id = ${contactId} AND user_id = ${userId}
    `;
  },

  async bulkDelete(contactIds, userId) {
    const validIds = contactIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    if (validIds.length === 0) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const placeholders = validIds.map((_, index) => `$${index + 2}`).join(', ');
    
    const result = await sql.query(
      `DELETE FROM contacts 
       WHERE id IN (${placeholders}) AND user_id = $1 
       RETURNING id`,
      [userId, ...validIds]
    );
    
    return { deletedCount: result.rowCount, deletedIds: result.rows.map(r => r.id) };
  },

  async update(contactId, userId, name, phone, countryCode, email = null) {
    const result = await sql`
      UPDATE contacts
      SET name = ${name}, phone = ${phone}, country_code = ${countryCode}, email = ${email}
      WHERE id = ${contactId} AND user_id = ${userId}
      RETURNING id, name, phone, country_code, email
    `;
    return result.rows[0];
  }
};
