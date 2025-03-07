import { OllamaEmbedding, Ollama } from "@llamaindex/ollama";
import { Document, Settings, VectorStoreIndex } from "llamaindex";


Settings.embedModel = new OllamaEmbedding({ model: "nomic-embed-text" });
Settings.llm = new Ollama({
    model: "llama3.2",
});

async function main() {
    const essay = 'Diabetes is a chronic disease that affects millions of people worldwide. It occurs when the body either does not produce enough insulin or cannot effectively use the insulin it produces. Insulin is a hormone responsible for regulating blood sugar (glucose) levels. Without proper management, diabetes can lead to serious health complications, including heart disease, kidney failure, nerve damage, and vision problems.'
    Settings.embedModel = new OllamaEmbedding({ model: "nomic-embed-text" });
    const document = new Document({ text: essay, id_: "essay" });
    const index = await VectorStoreIndex.fromDocuments([document]);
    const queryEngine = index.asQueryEngine();
    const query = "what is the cause of diabetes";
    const results = await queryEngine.query({
        query,
    });

    console.log(results);
}


main().catch(console.error);






