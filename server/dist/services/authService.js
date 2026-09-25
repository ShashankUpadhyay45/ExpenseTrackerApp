export const authService = {
    register: async (data) => { return { user: { id: '1', ...data }, token: 'token' }; },
    login: async (data) => { return { user: { id: '1', email: data.email }, token: 'token' }; }
};
