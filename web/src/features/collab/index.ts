/** Cổng công khai của tính năng "Cộng tác" (thành viên, liên kết mời, đề nghị xóa, checklist): chỉ phần API, hook dùng chung và chữ. */
export { collabGateway } from './api/collabClient.ts';
export type { ChecklistItem, CreatedInvite, DeletionRequest, InvitePreview, InviteStatus, Joined, Member, MemberRole, RequestStatus } from './api/CollabGateway.ts';
export { useLoaded } from './hooks/useLoaded.ts';
export { COLLAB_COPY } from './model/collab.copy.ts';
