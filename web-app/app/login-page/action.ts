"use server"
import { UserService } from "@/data-core/services/user-service"

export async function userLogin({ username, password }: { username: string, password: string }) {
    try {
        const result = await UserService.login({ username, password })
        return result

    } catch (error) {
        console.error('Error logging in:', error);
        throw Error("Error logging")
    }
}