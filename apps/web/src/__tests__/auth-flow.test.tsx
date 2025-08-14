import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../routes/App.js';

// Basic integration test mocking fetch to simulate API (T-010 validation)

global.fetch = (async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.url;
  const body = init?.body ? JSON.parse(init.body as string) : {};
  if (url.endsWith('/auth/register')) {
    return new Response(JSON.stringify({ user: { id: 'usr_1', email: body.email }, accessToken: 'at', refreshToken: 'rt' }), { status: 201 });
  }
  if (url.endsWith('/auth/login')) {
    return new Response(JSON.stringify({ user: { id: 'usr_1', email: body.email }, accessToken: 'at', refreshToken: 'rt' }), { status: 200 });
  }
  if (url.endsWith('/auth/refresh')) {
    return new Response(JSON.stringify({ accessToken: 'at2', refreshToken: 'rt2' }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'NOT_FOUND' }), { status: 404 });
}) as any;

describe('Auth flow (T-010)', () => {
  it('registers then shows dashboard', async () => {
    render(<MemoryRouter initialEntries={['/register']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    await waitFor(() => {
      // Element should exist
      expect(screen.getByText(/Dashboard/i)).toBeTruthy();
    });
    expect(screen.getByText(/new@example.com/)).toBeTruthy();
  });
});
