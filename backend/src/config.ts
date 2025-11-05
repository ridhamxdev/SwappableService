import 'dotenv/config';

export const PORT = parseInt(process.env.PORT || '4000', 10);
export const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
