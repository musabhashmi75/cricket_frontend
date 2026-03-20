import client from './client';

export const authApi = {
  login:          (email, password)                    => client.post('/auth/login', { email, password }).then(r => r.data),
  register:       (data)                               => client.post('/auth/register', data).then(r => r.data),
  me:             ()                                   => client.get('/auth/me').then(r => r.data),
  changePassword: (currentPassword, newPassword)       => client.put('/auth/change-password', { currentPassword, newPassword }),
};
