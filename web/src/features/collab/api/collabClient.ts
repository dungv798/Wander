import { apiClient } from '../../../shared/api/defaultClient.ts';
import { HttpCollabGateway } from './HttpCollabGateway.ts';

/** The app's shared collaboration gateway (calls the real API with the session secret attached). */
export const collabGateway = new HttpCollabGateway(apiClient);
