import { authService } from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';
export const register = async (req, res) => {
    const result = await authService.register(req.body);
    successResponse(res, result, 'User registered successfully');
};
export const login = async (req, res) => {
    const result = await authService.login(req.body);
    successResponse(res, result, 'User logged in successfully');
};
