export const authService = {
  register: async (data: any) => { return { user: { id: '1', ...data }, token: 'token' }; },
  login: async (data: any) => { return { user: { id: '1', email: data.email }, token: 'token' }; }
};