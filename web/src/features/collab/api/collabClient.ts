import { apiClient } from '../../../shared/api/defaultClient.ts';
import { HttpCollabGateway } from './HttpCollabGateway.ts';

/** Cổng cộng tác dùng chung của ứng dụng (gọi API thật với bí mật phiên đã gắn). */
export const collabGateway = new HttpCollabGateway(apiClient);
