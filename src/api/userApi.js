import client from './client';

export const userApi = {
  getAll:        ()                        => client.get('/admin/users').then(r => r.data),
  create:        (data)                    => client.post('/admin/users', data).then(r => r.data),
  resetPassword: (userId, newPassword)     => client.put(`/admin/users/${userId}/reset-password`, { newPassword }),
};
