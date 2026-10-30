import { useQuery } from '@tanstack/react-query';

import { api } from './client';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/health');
      if (error || !data) throw new Error('health check failed');
      return data;
    },
  });
}
