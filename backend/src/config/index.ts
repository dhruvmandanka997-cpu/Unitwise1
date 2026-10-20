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

  // In serverless environments (Vercel / AWS Lambda), the deployment filesystem is read-only.
  // /tmp is the only writable directory. Copy seed databases & JSON files into /tmp if not present.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.resolve('/tmp/unitwise-data');
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    const seedDataDir = path.resolve(backendDir, 'data');
    if (fs.existsSync(seedDataDir)) {
      try {
        const files = fs.readdirSync(seedDataDir);
        for (const file of files) {
          const src = path.join(seedDataDir, file);
          const dst = path.join(tmpDir, file);
          if (fs.statSync(src).isFile() && !fs.existsSync(dst)) {
            try {
              fs.copyFileSync(src, dst);
            } catch {}
          }
        }
      } catch {}
    }
    return tmpDir;
  }

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
  corsOrigin: process.env.CORS_ORIGIN || '*',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
  googleSearchCx: process.env.GOOGLE_SEARCH_CX || '',
  referenceProvider: process.env.REFERENCE_PROVIDER || 'auto',
  maxActivePlans: Number(process.env.MAX_ACTIVE_PLANS) || 3,
  dataDir: resolveDataDir(),
};
