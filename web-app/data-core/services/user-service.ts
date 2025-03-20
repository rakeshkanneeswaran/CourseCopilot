import prismaClient from "@/data-core/database";
import logger from "../utils/logger";

export class UserService {
    static async login({ username, password }: { username: string, password: string }) {
        try {
            logger.info(`Login attempt: ${username}`);

            const userExist = await prismaClient.credentials.findUnique({
                where: { username, password },
                include: { User: true }
            });

            if (userExist && userExist.User?.id) {
                logger.info(`User logged in successfully: ${userExist.User.id}`);
                return { status: true, userId: userExist.User.id };
            }

            logger.warn(`Login failed for username: ${username}`);
            return { status: false, userId: "" };
        } catch (error) {
            logger.error(`Error logging in for user ${username}:`, error);
            throw new Error("Failed to login");
        }
    }

    static async createUser({ username, password, name }: { username: string, password: string, name: string }) {
        try {
            logger.info(`User signup attempt: ${username}`);

            const result = await prismaClient.$transaction(async (tx) => {
                const userExist = await tx.credentials.findFirst({ where: { username } });

                if (userExist) {
                    logger.warn(`Signup failed: Username already exists - ${username}`);
                    return { status: false, userId: "" };
                }

                const credentials = await tx.credentials.create({
                    data: { username, password }
                });

                const user = await tx.user.create({
                    data: { credentialId: credentials.id, name, email: username }
                });

                logger.info(`User created successfully: ${user.id}`);
                return { status: true, userId: user.id };
            });

            return result;
        } catch (error) {
            logger.error(`Error signing up user ${username}:`, error);
            throw new Error("Failed to signup");
        }
    }

    static async createParticipant({ emailId, password, name }: { emailId: string, password: string, name: string }) {
        try {
            logger.info(`Participant signup attempt: ${emailId}`);

            const result = await prismaClient.$transaction(async (tx) => {
                const userExist = await tx.participantsCredentials.findFirst({ where: { emailId } });

                if (userExist) {
                    logger.warn(`Signup failed: Email already exists - ${emailId}`);
                    return { status: false, userId: "" };
                }

                const user = await tx.participants.create({
                    data: { name }
                });

                const credentials = await tx.participantsCredentials.create({
                    data: {
                        emailId: emailId,
                        password: password,
                        participantId: user.id
                    }
                });


                logger.info(`Participant created successfully: ${credentials.participantId}`);
                return { status: true, userId: credentials.participantId };
            });

            return result;
        } catch (error) {
            logger.error(`Error signing up participant ${emailId}:`, error);
            throw new Error("Failed to signup participant");
        }
    }

    static async findUserByCredentials({ username, password }: { username: string, password: string }) {
        try {
            logger.debug(`Finding user by credentials: ${username}`);
            console.log(`Finding user by credentials: ${username}`);
            console.log(process.env.DATABASE_URL);

            const userExist = await prismaClient.credentials.findUnique({
                where: { username, password },
                select: { User: true }
            });

            logger.info(`User found: ${userExist?.User?.id}`);
            console.log(`User found: ${userExist?.User?.id}`);

            if (!userExist?.User) {
                logger.warn(`User not found for credentials: ${username}`);
                throw new Error("User not found");
            }

            logger.info(`User found: ${userExist.User.id}`);
            return userExist.User.id;
        } catch (error) {
            logger.error(`Error finding user by credentials ${username}:`, error);
            throw new Error("Failed to find user by credentials");
        }
    }

    static async findParticipantByCredentials({ username, password }: { username: string, password: string }) {
        try {
            logger.debug(`Finding user by credentials: ${username}`);
            console.log(`Finding user by credentials: ${username}`);
            console.log(process.env.DATABASE_URL);

            const userExist = await prismaClient.participantsCredentials.findUnique({
                where: { emailId: username, password },
                select: { participantId: true }
            });

            logger.info(`User found: ${userExist?.participantId}`);

            if (!userExist?.participantId) {
                logger.warn(`User not found for credentials: ${username}`);
                throw new Error("User not found");
            }

            logger.info(`User found: ${userExist.participantId}`);
            return userExist.participantId;
        } catch (error) {
            logger.error(`Error finding user by credentials ${username}:`, error);
            throw new Error("Failed to find user by credentials");
        }
    }
}
