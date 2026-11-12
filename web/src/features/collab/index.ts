/** The public gate of the 'Collaboration' feature (members, invite links, deletion requests, checklist): only the API part, the shared hook and the copy. */
export { collabGateway } from './api/collabClient.ts';
export type { ChecklistItem, CreatedInvite, DeletionRequest, InvitePreview, InviteStatus, Joined, Member, MemberRole, RequestStatus } from './api/CollabGateway.ts';
export { useLoaded } from './hooks/useLoaded.ts';
export { COLLAB_COPY } from './model/collab.copy.ts';
