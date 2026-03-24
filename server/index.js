import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3021;
const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
async function init() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

init();

app.get('/api/vault', async (req, res) => {
  try {
    const data = await fs.readFile(VAULT_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Vault not found' });
    }
    res.status(500).json({ error: 'Error reading vault' });
  }
});

app.post('/api/vault', async (req, res) => {
  try {
    await fs.writeFile(VAULT_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error saving vault' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
