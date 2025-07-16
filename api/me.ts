// Vercel vai instalar essas dependências automaticamente durante o build.
// Certifique-se de configurar a variável de ambiente JWT_SECRET no seu projeto Vercel.
import jsonwebtoken from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'a-default-secret-for-development';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ error: 'Não autorizado: Nenhum token fornecido.' });
        }

        const decoded = jsonwebtoken.verify(token, JWT_SECRET) as User;
        
        return res.status(200).json({ id: decoded.id, email: decoded.email });

    } catch (error) {
        // This will catch expired tokens, invalid signatures, etc.
        console.error('Me API Error:', error);
        return res.status(401).json({ error: 'Não autorizado: Token inválido.' });
    }
}
