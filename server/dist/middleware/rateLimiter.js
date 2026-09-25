import rateLimit from 'express-rate-limit';
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again in 15 minutes!'
});
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many login attempts from this IP, please try again in 15 minutes!'
});
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many AI requests, please try again in a minute!'
});
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many upload requests, please try again in a minute!'
});
