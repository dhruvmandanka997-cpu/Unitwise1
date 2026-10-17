import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory, or root if present
const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

function resolveDataDir(): string {
  if (process.env.NODE_ENV === 'test') {
    const testDir = path.resolve(__dirname, '../../data/test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    return testDir;
  }

  const backendDir = path.resolve(__dirname, '../../');
  const rootDir = path.resolve(__dirname, '../../../');
  const candidates: string[] = [];

  if (process.env.DATA_DIR) {
    candidates.push(path.resolve(process.env.DATA_DIR));
    candidates.push(path.resolve(rootDir, process.env.DATA_DIR));
    candidates.push(path.resolve(backendDir, process.env.DATA_DIR));
  }

  candidates.push(path.resolve(backendDir, 'data'));
  candidates.push(path.resolve(backendDir, 'server/data'));
  candidates.push(path.resolve(process.cwd(), 'data'));

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'plans.json'))) {
      return dir;
    }
  }
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return path.resolve(backendDir, 'data');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
  googleSearchCx: process.env.GOOGLE_SEARCH_CX || '',
  referenceProvider: process.env.REFERENCE_PROVIDER || 'auto',
  dataDir: resolveDataDir(),
};
