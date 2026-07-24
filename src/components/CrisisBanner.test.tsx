import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrisisBanner } from './CrisisBanner';

describe('CrisisBanner', () => {
  it('renders as an alert with crisis resources', () => {
    render(<CrisisBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/)).toBeInTheDocument();
    expect(screen.getByText(/741741/)).toBeInTheDocument();
  });
});
