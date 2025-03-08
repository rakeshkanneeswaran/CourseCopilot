from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

embeddings = OllamaEmbeddings(model="llama3")


class EmbeddingService:
    @staticmethod
    def createVectorStore(texts):
        vectorstore = FAISS.from_texts(texts, embedding=embeddings)
        return vectorstore

    @staticmethod
    def saveVectorStore(vectorstore, path):
        vectorstore.save_local(path)

    @staticmethod
    def loadVectorStore(path):
        loaded_vectorstore = FAISS.load_local(
            path, embeddings, allow_dangerous_deserialization=True
        )
        return loaded_vectorstore

    @staticmethod
    def retrieveText(vectorstore, query):
        retriever = vectorstore.as_retriever()
        retrieved_documents = retriever.invoke(query)
        return retrieved_documents[0].page_content
