// Vercel vai instalar a dependência `cookie` automaticamente durante o build.
import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // Set the cookie to a past date to expire it immediately
    const cookie = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    
    return res.status(200).json({ message: 'Logout bem-sucedido.' });
}
