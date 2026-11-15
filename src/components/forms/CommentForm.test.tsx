import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentForm from './CommentForm';
import * as db from '@/lib/db';

const mockGetUser = vi.fn();
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const mockToastWarning = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({
    warning: mockToastWarning,
    error: mockToastError,
    success: vi.fn(),
  }),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    createComment: vi.fn(),
  };
});

function makePostgrestError(code: string, message: string) {
  return {
    code,
    message,
    details: '',
    hint: '',
    name: 'PostgrestError',
    toJSON: () => ({
      name: 'PostgrestError',
      code,
      message,
      details: '',
      hint: '',
    }),
  };
}

describe('CommentForm component', () => {
  const onCommentAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('renders localized dictionary text and falls back to getDictionaryClient when dict is omitted', () => {
    render(<CommentForm publicationId="pub-1" onCommentAdded={onCommentAdded} />);

    expect(screen.getByText('Deixa o teu comentario')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Escribe aquí a túa reflexión sobre o artigo...')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar comentario' })).toBeInTheDocument();
  });

  it('calls createComment from DAL and invokes onCommentAdded on success', async () => {
    const user = userEvent.setup();
    vi.mocked(db.createComment).mockResolvedValue({
      data: {
        id: 'c-1',
        publication_id: 'pub-1',
        author_id: 'user-1',
        content: 'Gran artigo!',
        updated_at: '2026-10-01T12:00:00Z',
      },
      error: null,
    });

    render(<CommentForm publicationId="pub-1" onCommentAdded={onCommentAdded} />);

    await user.type(screen.getByRole('textbox'), '  Gran artigo!  ');
    await user.click(screen.getByRole('button', { name: 'Publicar comentario' }));

    await waitFor(() => {
      expect(db.createComment).toHaveBeenCalledWith(
        'pub-1',
        'user-1',
        'Gran artigo!',
        mockSupabase
      );
      expect(onCommentAdded).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('shows localized warning toast on Postgres duplicate error 23505', async () => {
    const user = userEvent.setup();
    vi.mocked(db.createComment).mockResolvedValue({
      data: null,
      error: makePostgrestError('23505', 'duplicate key value'),
    });

    const enDict = {
      leaveComment: 'Leave a comment',
      placeholder: 'Write your thoughts...',
      submit: 'Post comment',
      submitting: 'Posting...',
      alreadyCommented: 'You already commented on this article.',
      postError: 'Error posting comment.',
    };

    render(
      <CommentForm
        articuloId="pub-2"
        onCommentAdded={onCommentAdded}
        dict={enDict}
      />
    );

    await user.type(screen.getByPlaceholderText('Write your thoughts...'), 'Second comment');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    await waitFor(() => {
      expect(mockToastWarning).toHaveBeenCalledWith('You already commented on this article.');
      expect(onCommentAdded).not.toHaveBeenCalled();
    });
  });

  it('shows localized error toast on non-duplicate database error', async () => {
    const user = userEvent.setup();
    vi.mocked(db.createComment).mockResolvedValue({
      data: null,
      error: makePostgrestError('42501', 'permission denied'),
    });

    render(<CommentForm publicationId="pub-1" onCommentAdded={onCommentAdded} />);

    await user.type(screen.getByRole('textbox'), 'Comment attempt');
    await user.click(screen.getByRole('button', { name: 'Publicar comentario' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erro ao publicar o comentario.');
      expect(onCommentAdded).not.toHaveBeenCalled();
    });
  });
});
