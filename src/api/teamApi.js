import client from './client';

export const teamApi = {
  getAll:       ()           => client.get('/teams').then(r => r.data),
  getOne:       (id)         => client.get(`/teams/${id}`).then(r => r.data),
  create:       (data)       => client.post('/teams', data).then(r => r.data),
  update:       (id, data)   => client.put(`/teams/${id}`, data).then(r => r.data),
  uploadBanner: (id, file)   => {
    const form = new FormData();
    form.append('file', file);
    return client.post(`/teams/${id}/banner`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  getMembers:   (id)         => client.get(`/teams/${id}/members`).then(r => r.data),
  join:         (id)         => client.post(`/teams/${id}/join`).then(r => r.data),
  leave:        (id)         => client.delete(`/teams/${id}/leave`),
};
