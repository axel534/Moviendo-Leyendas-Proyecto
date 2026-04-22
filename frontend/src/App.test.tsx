import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/inicio/i)).toBeInTheDocument();
    expect(screen.getByText(/acerca/i)).toBeInTheDocument();
  });
});
