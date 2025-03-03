import jwt from 'jsonwebtoken';
import { UserService } from './user-service';

export class AuthenticationService {
    static async signIn(username: string, password: string) {
        try {
            const userId = await UserService.findUserByCredentials({ username, password });
            if (!userId) {
                throw new Error('Invalid credentials');
            }
            const token = jwt.sign({ userId }, process.env.JWT_SECRET!)
            return {
                token,
                userId
            }
        } catch (error) {
            console.error('Error signing in:', error);
            throw new Error('Failed to sign in');
        }

    }

    static async verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            return decoded;
        } catch (error) {
            console.error('Error verifying token:', error);
            throw new Error('Invalid token');
        }
    }
}