

import prismaClient from "@/data-core/database";
export class UserService {
    static async login({ username, password }: { username: string, password: string }) {
        try {
            const userExist = await prismaClient.credentials.findUnique({
                where: {
                    username,
                    password

                },
                include: {
                    User: true
                }
            })
            if (userExist && userExist.User?.id) {
                return {
                    status: true,
                    userId: userExist.User?.id
                }
            }
            return {
                status: false,
                userId: ""
            }
        } catch (error) {
            console.error('Error logging in:', error);
            throw new Error('Failed to login');
        }

    }
}