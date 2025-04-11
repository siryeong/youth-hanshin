import { CafeMenuItem } from '@/model/model';
import { fetchApi } from './Request';

export async function fetchCafeMenuItems(): Promise<CafeMenuItem[]> {
  return fetchApi<CafeMenuItem[]>('/api/cafe-menu-items');
}
