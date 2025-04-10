import { CafeSetting } from '@/model/model';
import { fetchApi } from './Request';

export async function fetchCafeSettings(): Promise<CafeSetting> {
  return fetchApi<CafeSetting>('/api/cafe-settings');
}
