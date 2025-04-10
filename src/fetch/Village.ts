import { Village } from '@/model/model';
import { fetchApi } from './Request';

export async function fetchVillages(withMembers: boolean = false): Promise<Village[]> {
  return fetchApi<Village[]>(`/api/villages${withMembers ? '?members=true' : ''}`);
}
