// Load test environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test file for E2E tests
const envTestPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envTestPath });

console.log('🧪 Test environment loaded');
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
