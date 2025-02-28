import { kafka_admin } from "./kafka-config";

const checkTopicExists = async (topicName: string) => {
    const admin = kafka_admin.admin();
    await admin.connect();

    const topics = await admin.listTopics(); // Get all topics


    if (topics.includes(topicName)) {
        console.log(`✅ Topic "${topicName}" exists.`);
    } else {
        console.log(`Topic "${topicName}" does NOT exist.`);
        await admin.createTopics({
            topics: [
                {
                    topic: 'process-video',
                    numPartitions: 1,
                    replicationFactor: 1,
                },
            ],
        });
    };
    await admin.disconnect();
    console.log(`✅ admin disconnect from kafka server`);
}


checkTopicExists('process-video').catch(console.error)