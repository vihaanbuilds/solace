import { PrivatePasscodeRecord } from '../storage';

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

async function digest(passcode: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${passcode}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

export async function createPasscodeRecord(passcode: string): Promise<PrivatePasscodeRecord> {
  const salt = randomSalt();
  const hash = await digest(passcode, salt);
  return { salt, hash };
}

export async function verifyPasscode(
  passcode: string,
  record: PrivatePasscodeRecord
): Promise<boolean> {
  const hash = await digest(passcode, record.salt);
  return hash === record.hash;
}
