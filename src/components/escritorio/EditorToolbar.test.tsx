import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorToolbar from './EditorToolbar';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  EDITOR_ACTIONS,
  PERMISSIONS,
  PUBLICATION_STATUSES,
  USER_ROLES,
  resolvePermissionsForRoles,
  type PermissionValue,
} from '@/lib/db/schema';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const glDict = getDictionaryClient('gl').articleEditor;

function renderToolbar({
  mode = 'edit',
  publicationStatus = PUBLICATION_STATUSES.DRAFT,
  permissions,
}: {
  mode?: 'create' | 'edit';
  publicationStatus?: string;
  permissions?: readonly PermissionValue[];
}) {
  const onSubmitAction = vi.fn();
  const onOpenPublishModal = vi.fn();

  render(
    <EditorToolbar
      editor={null}
      routeLang="gl"
      mode={mode}
      permissions={permissions}
      publicationStatus={publicationStatus}
      isPublishing={false}
      showIndex={false}
      onInsertImage={vi.fn()}
      onInsertYoutube={vi.fn()}
      onInsertMath={vi.fn()}
      onInsertTable={vi.fn()}
      onToggleShowIndex={vi.fn()}
      onClearAll={vi.fn()}
      onChangeCover={vi.fn()}
      onOpenPreview={vi.fn()}
      onSubmitAction={onSubmitAction}
      onOpenPublishModal={onOpenPublishModal}
    />
  );

  return { onSubmitAction, onOpenPublishModal };
}

describe('EditorToolbar atomic permission gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { label: 'reader', permissions: resolvePermissionsForRoles([USER_ROLES.READER]) },
    { label: 'guest', permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]) },
    { label: 'member', permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]) },
    {
      label: 'overlapping guest + member',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
    },
    { label: 'zero-role', permissions: [] },
    {
      label: 'custom publications:review only without publications:publish',
      permissions: [PERMISSIONS.PUBLICATIONS_REVIEW],
    },
  ])('renders send-for-approval (not Publish) on draft for $label', ({ permissions }) => {
    const { onSubmitAction, onOpenPublishModal } = renderToolbar({
      mode: 'create',
      publicationStatus: PUBLICATION_STATUSES.DRAFT,
      permissions,
    });

    const submitBtn = screen.getByRole('button', { name: glDict.sendForApproval });
    expect(submitBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`^${glDict.publish}$`, 'i') })).not.toBeInTheDocument();

    fireEvent.click(submitBtn);
    expect(onSubmitAction).toHaveBeenCalledWith(EDITOR_ACTIONS.SUBMIT_APPROVAL);
    expect(onOpenPublishModal).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'founder', permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]) },
    { label: 'admin', permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]) },
    {
      label: 'overlapping founder + admin',
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
    },
    {
      label: 'custom publications:publish only without publications:review',
      permissions: [PERMISSIONS.PUBLICATIONS_PUBLISH],
    },
  ])('renders Publish (not send-for-approval) on draft for $label', ({ permissions }) => {
    const { onOpenPublishModal } = renderToolbar({
      mode: 'create',
      publicationStatus: PUBLICATION_STATUSES.DRAFT,
      permissions,
    });

    const publishBtn = screen.getByRole('button', { name: new RegExp(`^${glDict.publish}$`, 'i') });
    expect(publishBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: glDict.sendForApproval })).not.toBeInTheDocument();

    fireEvent.click(publishBtn);
    expect(onOpenPublishModal).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: 'reader', permissions: resolvePermissionsForRoles([USER_ROLES.READER]) },
    { label: 'guest', permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]) },
    { label: 'member', permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]) },
    {
      label: 'overlapping guest + member',
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
    },
    { label: 'zero-role', permissions: [] },
    {
      label: 'custom publications:publish only without publications:review',
      permissions: [PERMISSIONS.PUBLICATIONS_PUBLISH],
    },
  ])('renders revoke-approval (not Approve/Reject) on in_review for $label', ({ permissions }) => {
    const { onSubmitAction } = renderToolbar({
      mode: 'edit',
      publicationStatus: PUBLICATION_STATUSES.IN_REVIEW,
      permissions,
    });

    const revokeBtn = screen.getByRole('button', { name: new RegExp(glDict.revokeApproval, 'i') });
    expect(revokeBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: glDict.approveAndPublish })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: glDict.reject })).not.toBeInTheDocument();

    fireEvent.click(revokeBtn);
    expect(onSubmitAction).toHaveBeenCalledWith(EDITOR_ACTIONS.REVOKE_APPROVAL);
  });

  it.each([
    { label: 'founder', permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]) },
    { label: 'admin', permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]) },
    {
      label: 'overlapping founder + admin',
      permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]),
    },
    {
      label: 'custom publications:review only without publications:publish',
      permissions: [PERMISSIONS.PUBLICATIONS_REVIEW],
    },
  ])('renders Approve and Reject on in_review for $label', ({ permissions }) => {
    const { onSubmitAction } = renderToolbar({
      mode: 'edit',
      publicationStatus: PUBLICATION_STATUSES.IN_REVIEW,
      permissions,
    });

    const rejectBtn = screen.getByRole('button', { name: glDict.reject });
    const approveBtn = screen.getByRole('button', { name: glDict.approveAndPublish });
    expect(rejectBtn).toBeInTheDocument();
    expect(approveBtn).toBeInTheDocument();

    fireEvent.click(rejectBtn);
    expect(onSubmitAction).toHaveBeenCalledWith(EDITOR_ACTIONS.REJECT);

    fireEvent.click(approveBtn);
    expect(onSubmitAction).toHaveBeenCalledWith(EDITOR_ACTIONS.APPROVE);
  });

  it('fails closed when permissions is [] or omitted', () => {
    const { rerender } = render(
      <EditorToolbar
        editor={null}
        routeLang="gl"
        mode="edit"
        permissions={[]}
        publicationStatus={PUBLICATION_STATUSES.IN_REVIEW}
        isPublishing={false}
        showIndex={false}
        onInsertImage={vi.fn()}
        onInsertYoutube={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertTable={vi.fn()}
        onToggleShowIndex={vi.fn()}
        onClearAll={vi.fn()}
        onChangeCover={vi.fn()}
        onOpenPreview={vi.fn()}
        onSubmitAction={vi.fn()}
        onOpenPublishModal={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: glDict.approveAndPublish })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: glDict.reject })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(glDict.revokeApproval, 'i') })).toBeInTheDocument();

    rerender(
      <EditorToolbar
        editor={null}
        routeLang="gl"
        mode="edit"
        publicationStatus={PUBLICATION_STATUSES.IN_REVIEW}
        isPublishing={false}
        showIndex={false}
        onInsertImage={vi.fn()}
        onInsertYoutube={vi.fn()}
        onInsertMath={vi.fn()}
        onInsertTable={vi.fn()}
        onToggleShowIndex={vi.fn()}
        onClearAll={vi.fn()}
        onChangeCover={vi.fn()}
        onOpenPreview={vi.fn()}
        onSubmitAction={vi.fn()}
        onOpenPublishModal={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: glDict.approveAndPublish })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: glDict.reject })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(glDict.revokeApproval, 'i') })).toBeInTheDocument();
  });
});
