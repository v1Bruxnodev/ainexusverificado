// Vercel vai instalar essas dependências automaticamente durante o build.
// Certifique-se de configurar as variáveis de ambiente KV_* e JWT_SECRET no seu projeto Vercel.
import { kv } from '@vercel/kv';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'a-default-secret-for-development';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const lowerCaseEmail = email.toLowerCase();
        const userJson = await kv.get<string>(`user:${lowerCaseEmail}`);

        if (!userJson) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }
        
        const user = JSON.parse(userJson);

        const passwordMatch = await bcryptjs.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }
        
        const userPayload = { id: user.id, email: user.email };

        const token = jsonwebtoken.sign(userPayload, JWT_SECRET, {
            expiresIn: '7d',
        });

        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);

        return res.status(200).json(userPayload);

    } catch (error) {
        console.error('Login API Error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
