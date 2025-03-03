

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

    static async createUser({ username, password, name }: { username: string, password: string, name: string }) {
        try {
            const result = await prismaClient.$transaction(async (tx) => {
                const userExist = await tx.credentials.findMany({
                    where: {
                        username
                    }
                })

                if (userExist.length > 0) {
                    return {
                        status: false,
                        userId: ""
                    }
                }

                const credentials = await tx.credentials.create({
                    data: {
                        username,
                        password
                    }
                });

                const user = await tx.user.create({
                    data: {
                        credentialId: credentials.id,
                        name,
                        email: username
                    }
                })

                return {
                    status: false,
                    userId: user.id
                }
            })

            return result


        } catch (error) {
            console.error('Error signing up:', error);
            throw new Error('Failed to signup');
        }
    }

    static async findUserByCredentials({ username, password }: { username: string, password: string }) {
        try {
            const userExist = await prismaClient.credentials.findUnique({
                where: {
                    username,
                    password
                },
                select: {
                    User: true
                }
            })
            if (!userExist?.User) {
                throw new Error('User not found');
            }
            return userExist.User.id
        } catch (error) {
            console.error('Error finding user by credentials:', error);
            throw new Error('Failed to find user by credentials');
        }
    }
}