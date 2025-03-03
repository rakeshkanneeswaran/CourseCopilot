"use server"
import { AuthenticationService } from "@/data-core/services/authentication-service"

export async function userLogin({ username, password }: { username: string, password: string }) {
    try {
        const result = await AuthenticationService.signIn(username, password)
        return result

    } catch (error) {
        console.error('Error logging in:', error);
        throw Error("Error logging")
    }
}