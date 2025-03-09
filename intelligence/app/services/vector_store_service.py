from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="llama3")


class VectorStoreService:
    @staticmethod
    def loadVectorStore(path):
        loaded_vectorstore = FAISS.load_local(
            path, embeddings, allow_dangerous_deserialization=True
        )
        return loaded_vectorstore

    @staticmethod
    def retrieveText(vectorstore, query):
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        retrieved_documents = retriever.invoke(query)
        if len(retrieved_documents) == 0:
            return "No context found."
        docArray = []

        for doc in retrieved_documents:
            docArray.append(doc.page_content)
        return docArray
