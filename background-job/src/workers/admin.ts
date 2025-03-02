import { kafka_admin } from "./kafka-config";
import axios from "axios";

const checkTopicExists = async (topicName: string) => {
    console.log("🔍 Checking health of the intelligence server...");
    try {
        const response = await axios.get("http://localhost:3003/health");
        if (response.status === 200) {
            console.log("✅ Intelligence server is up and running.");
        } else {
            throw new Error(`❌ Intelligence server responded with status: ${response.status}`);
        }
    } catch (error) {
        throw new Error("❌ Intelligence server is down or unreachable.");
    }
    const admin = kafka_admin.admin();
    try {
        await admin.connect();
        console.log(`🔍 Checking if topic "${topicName}" exists...`);

        const topics = await admin.listTopics();

        if (topics.includes(topicName)) {
            console.log(`✅ Topic "${topicName}" exists.`);
        } else {
            console.warn(`🟡 Topic "${topicName}" does NOT exist. Creating it now...`);
            await admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions: 1,
                        replicationFactor: 1,
                    },
                ],
            });
            console.log(`✅ Topic "${topicName}" successfully created.`);
        }
    } catch (error) {
        console.error(`❌ Error checking/creating topic:`, error);
    } finally {
        await admin.disconnect();
        console.log(`🔌 Disconnected from Kafka admin.`);
    }

};

checkTopicExists("process-video").catch(console.error);
