import { describe, it, expect } from 'vitest';
import { isCrisis } from './crisisDetection';

describe('isCrisis', () => {
  it('flags direct statements of wanting to die', () => {
    expect(isCrisis('I want to die')).toBe(true);
  });

  it('flags self-harm language', () => {
    expect(isCrisis('sometimes I think about hurting myself')).toBe(true);
  });

  it('flags "suicide" mentions', () => {
    expect(isCrisis('I keep having thoughts about suicide')).toBe(true);
  });

  it('does not flag ordinary text', () => {
    expect(isCrisis('I love pizza and I had a good day')).toBe(false);
  });

  it('does not flag ordinary sadness without crisis language', () => {
    expect(isCrisis('I feel really sad and empty today')).toBe(false);
  });
});
