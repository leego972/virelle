import mysql from 'mysql2/promise';
  import bcrypt from 'bcryptjs';

  const DATABASE_URL = process.env.DATABASE_URL;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Studio Admin';

  if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Required: DATABASE_URL, ADMIN_EMAIL, ADMIN_SEED_PASSWORD');
    process.exit(1);
  }

  async function main() {
    const connection = await mysql.createConnection(DATABASE_URL);
    const openId = `email_${ADMIN_EMAIL}`;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);

    if (rows.length > 0) {
      await connection.execute(
        'UPDATE users SET passwordHash = ?, role = ?, name = ? WHERE email = ?',
        [passwordHash, 'admin', ADMIN_NAME, ADMIN_EMAIL]
      );
      console.log('Updated existing user to admin');
    } else {
      await connection.execute(
        'INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [openId, ADMIN_NAME, ADMIN_EMAIL, passwordHash, 'email', 'admin']
      );
      console.log('Created new admin user');
    }

    const [verify] = await connection.execute('SELECT id, openId, name, email, role FROM users WHERE email = ?', [ADMIN_EMAIL]);
    console.log('User:', verify[0]);
    await connection.end();
  }

  main().catch(console.error);
  