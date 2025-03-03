"use server"
import { AuthenticationService } from "@/data-core/services/authentication-service";

export async function getUserId({ token }: { token: string }) {
    try {
        const value = await AuthenticationService.verifyToken(token);
        return value.userId;
    } catch (error) {
        throw error;
    }
}