import jwt from 'jsonwebtoken';
import { UserService } from './user-service';
import logger from '../utils/logger';

export class AuthenticationService {
    static async signIn(username: string, password: string) {
        try {
            const userId = await UserService.findUserByCredentials({ username, password });
            if (!userId) {
                throw new Error('Invalid credentials');
            }
            console.log("starting to creata token", userId);
            const token = jwt.sign({ userId }, process.env.JWT_SECRET!)
            console.log("this the value of toknen", token);
            return {
                token,
                userId
            }
        } catch (error) {
            logger.error('Error signing in:', error);
            throw new Error('Failed to sign in');
        }

    }

    static async signInParticipant(username: string, password: string) {
        try {
            const userId = await UserService.findParticipantByCredentials({ username, password });
            if (!userId) {
                throw new Error('Invalid credentials');
            }
            console.log("starting to creata token", userId);
            const token = jwt.sign({ userId }, process.env.JWT_SECRET!)
            console.log("this the value of toknen", token);
            return {
                token,
                userId
            }
        } catch (error) {
            logger.error('Error signing in:', error);
            throw new Error('Failed to sign in');
        }
    }

    static async verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            return decoded;
        } catch (error) {
            logger.error('Error verifying token:', error);
            throw new Error('Invalid token');
        }
    }


}