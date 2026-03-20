import client from './client';

export const matchApi = {
  getAll:     (status)    => client.get('/matches', { params: status ? { status } : {} }).then(r => r.data),
  getOne:     (id)        => client.get(`/matches/${id}`).then(r => r.data),
  create:     (data)      => client.post('/matches', data).then(r => r.data),
  update:     (id, data)  => client.put(`/matches/${id}`, data).then(r => r.data),
  remove:     (id)        => client.delete(`/matches/${id}`),
  complete:   (id)        => client.post(`/matches/${id}/complete`).then(r => r.data),
  getPlayers: (matchId)   => client.get(`/matches/${matchId}/players`).then(r => r.data),
  join:        (matchId, userId) =>
    client.post(`/matches/${matchId}/join`, { userId }).then(r => r.data),
  leave:       (matchId, userId) =>
    client.delete(`/matches/${matchId}/leave`, { params: { userId } }),
  joinAsGuest: (matchId, guestName, guestContact) =>
    client.post(`/matches/${matchId}/join-guest`, { guestName, guestContact }).then(r => r.data),
};
