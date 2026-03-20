import client from './client';

export const teamApi = {
  getAll:     ()          => client.get('/teams').then(r => r.data),
  getOne:     (id)        => client.get(`/teams/${id}`).then(r => r.data),
  create:     (data)      => client.post('/teams', data).then(r => r.data),
  getMembers: (id)        => client.get(`/teams/${id}/members`).then(r => r.data),
  join:       (id)        => client.post(`/teams/${id}/join`).then(r => r.data),
  leave:      (id)        => client.delete(`/teams/${id}/leave`),
};
