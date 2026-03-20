import client from './client';

export const paymentApi = {
  upload: (matchId, userId, file) => {
    const form = new FormData();
    form.append('matchId', matchId);
    form.append('userId', userId);
    form.append('file', file);
    return client.post('/payments/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  createPending: (matchId, userId) =>
    client.post('/payments/pending', null, { params: { matchId, userId } }).then(r => r.data),

  getByMatch:  (matchId, status) =>
    client.get(`/payments/match/${matchId}`, { params: status ? { status } : {} }).then(r => r.data),

  getByUser:   (userId)           => client.get(`/payments/user/${userId}`).then(r => r.data),

  getOne:      (matchId, userId)  =>
    client.get(`/payments/match/${matchId}/user/${userId}`).then(r => r.data),
};
