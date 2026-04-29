import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/auth';

const login = async (username, password, device_id) => {
    const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
        device_id
    });
    return response.data;
};

const register = async (username, password, email, fullname) => {
    const response = await axios.post(`${API_URL}/register`, {
        username,
        password,
        email,
        fullname
    });
    return response.data;
};

const forgotPassword = async (email) => {
    const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
    });
    return response.data;
};

const resetPassword = async (token, password) => {
    const response = await axios.post(`${API_URL}/reset-password`, {
        token,
        password,
    });
    return response.data;
};

const refreshToken = async (token) => {
    const response = await axios.post(`${API_URL}/refresh-token`, {
        token,
    });
    return response.data;
};

const AuthService = {
    login,
    register,
    forgotPassword,
    resetPassword,
    refreshToken,
};

export default AuthService;
