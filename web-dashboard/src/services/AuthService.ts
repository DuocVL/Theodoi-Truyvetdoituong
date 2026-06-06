import api from './api';

// We can define more specific types later
type User = any;
type AuthResponse = {
  token: string;
  refreshToken: string;
  user: User;
};

const login = async (username: string, password: string, device_id: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', {
    username,
    password,
    device_id,
  });
  return response.data;
};

const getMe = async (): Promise<{user: User}> => {
    const response = await api.get('/auth/me');
    return response.data;
}

// We might not need refreshToken logic on the client-side for now, 
// can be handled by interceptors later.

const AuthService = {
  login,
  getMe,
};

export default AuthService;
