import { describe, it, expect } from 'vitest';
import { RESPONSE_TEMPLATES, CRISIS_RESPONSES } from './templates';

describe('template conversational continuity', () => {
  it('every Comforter and Uplifter emotion response invites the user to keep talking', () => {
    const offenders: string[] = [];
    for (const emotion of Object.keys(RESPONSE_TEMPLATES) as (keyof typeof RESPONSE_TEMPLATES)[]) {
      for (const mode of ['comforter', 'uplifter'] as const) {
        for (const line of RESPONSE_TEMPLATES[emotion][mode]) {
          if (!line.includes('?')) {
            offenders.push(`${emotion}.${mode}: "${line}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every Comforter and Uplifter crisis response invites the user to keep talking', () => {
    const offenders: string[] = [];
    for (const mode of ['comforter', 'uplifter'] as const) {
      for (const line of CRISIS_RESPONSES[mode]) {
        if (!line.includes('?')) {
          offenders.push(`${mode}: "${line}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
