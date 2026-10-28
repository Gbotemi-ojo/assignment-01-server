import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from current directory or root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID || '1gyuhg7Gx84acLtbZed506b4wOW8R31Cmn2p6VZVFxWs';

export const SHEET_NAME =
  process.env.GOOGLE_SHEET_NAME || 'Inspection Request';

/**
 * Loads Google Service Account credentials either from .env individual variables
 * or from JSON key file / credentials JSON string.
 */
export function getGoogleCredentials() {
  const clientEmail =
    process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (clientEmail && privateKey) {
    // Unescape literal \n sequences if present in env string
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    // Clean up surrounding quotes if needed
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    return {
      client_email: clientEmail,
      private_key: privateKey,
      project_id: projectId,
    };
  }

  // Fallback 1: check if whole service account JSON is in env variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON string');
    }
  }

  // Fallback 2: Check local JSON file path
  const keyPaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'dashboard-512907-27495dea56a2.json'),
    path.resolve(__dirname, '../../../dashboard-512907-27495dea56a2.json'),
    path.resolve(__dirname, '../../dashboard-512907-27495dea56a2.json'),
  ].filter(Boolean) as string[];

  for (const p of keyPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`Could not read credentials from ${p}`, err);
      }
    }
  }

  throw new Error(
    'No valid Google Service Account credentials found. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in your environment variables.'
  );
}

/**
 * Initializes and returns an authenticated Google Sheets API client
 */
export async function getSheetsClient() {
  const creds = getGoogleCredentials();

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}
