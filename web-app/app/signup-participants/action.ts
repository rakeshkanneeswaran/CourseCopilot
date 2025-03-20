"use server"
import { UserService } from "@/data-core/services/user-service"



export async function userSignup({ username, password, name }: { username: string, password: string, name: string }) {
    try {
        const result = await UserService.createParticipant({ emailId: username, password, name })
        return result
    } catch (error) {
        console.error('Error signing up:', error);
        throw Error("Error signing up")
    }
}