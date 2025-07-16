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
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        const lowerCaseEmail = email.toLowerCase();
        const existingUser = await kv.get(`user:${lowerCaseEmail}`);

        if (existingUser) {
            return res.status(409).json({ error: 'Um usuário com este email já existe.' });
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const userId = `user_${Date.now()}`;
        const newUser = {
            id: userId,
            email: lowerCaseEmail,
            passwordHash,
        };

        await kv.set(`user:${lowerCaseEmail}`, JSON.stringify(newUser));

        const userPayload = { id: newUser.id, email: newUser.email };

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
        
        return res.status(201).json(userPayload);

    } catch (error) {
        console.error('Register API Error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
