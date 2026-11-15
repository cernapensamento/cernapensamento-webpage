import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordForm from './PasswordForm';
import { getDictionaryClient } from '@/dictionaries/client';

const mockUpdateUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

const glDashboard = getDictionaryClient('gl').dashboard;

describe('PasswordForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens modal and renders dictionary labels without hardcoded strings', async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);

    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.button }));

    expect(screen.getByText(glDashboard.passwordForm.modalTitle)).toBeInTheDocument();
    expect(screen.getByLabelText(glDashboard.passwordForm.newPassword)).toBeInTheDocument();
    expect(screen.getByLabelText(glDashboard.passwordForm.confirmPassword)).toBeInTheDocument();
  });

  it('renders structured error feedback when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);

    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.button }));
    await user.type(screen.getByLabelText(glDashboard.passwordForm.newPassword), 'secret123');
    await user.type(screen.getByLabelText(glDashboard.passwordForm.confirmPassword), 'different123');
    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.save }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(glDashboard.passwordForm.mismatch);
    expect(alert.className).toContain('text-red-800');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('renders structured error feedback when password is too short', async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);

    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.button }));
    await user.type(screen.getByLabelText(glDashboard.passwordForm.newPassword), '12345');
    await user.type(screen.getByLabelText(glDashboard.passwordForm.confirmPassword), '12345');
    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.save }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(glDashboard.passwordForm.tooShort);
    expect(alert.className).toContain('text-red-800');
  });

  it('renders structured success feedback even if success text contains Error-like words', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ error: null });

    const customDict = {
      unknownError: 'Unknown error',
      passwordForm: {
        button: 'Change Password',
        modalTitle: 'Update Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        save: 'Save Password',
        updating: 'Updating...',
        mismatch: 'Mismatch',
        tooShort: 'Too short',
        success: 'Password updated with zero Error!',
        close: 'Close',
      },
    };

    render(<PasswordForm dict={customDict} lang="en" />);

    await user.click(screen.getByRole('button', { name: 'Change Password' }));
    await user.type(screen.getByLabelText('New Password'), 'securepass');
    await user.type(screen.getByLabelText('Confirm Password'), 'securepass');
    await user.click(screen.getByRole('button', { name: 'Save Password' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Password updated with zero Error!');
    expect(status.className).toContain('text-green-800');
  });

  it('uses localized unknownError when rejected with a non-Error value', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockRejectedValue(null);

    render(<PasswordForm />);

    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.button }));
    await user.type(screen.getByLabelText(glDashboard.passwordForm.newPassword), 'securepass');
    await user.type(screen.getByLabelText(glDashboard.passwordForm.confirmPassword), 'securepass');
    await user.click(screen.getByRole('button', { name: glDashboard.passwordForm.save }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(glDashboard.unknownError);
      expect(alert.className).toContain('text-red-800');
    });
  });
});
