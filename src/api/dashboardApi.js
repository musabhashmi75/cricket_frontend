import client from './client';

export const dashboardApi = {
  admin:  ()       => client.get('/dashboard/admin').then(r => r.data),
  player: (userId) => client.get('/dashboard/player', { params: { userId } }).then(r => r.data),
};
