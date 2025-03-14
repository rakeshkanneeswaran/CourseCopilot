from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
import random


model_name = "BAAI/bge-small-en"


embeddings = HuggingFaceBgeEmbeddings(model_name=model_name)


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

    @staticmethod
    def getContentForTestGeneration(vectorstore):
        all_docs = list(vectorstore.docstore._dict.values())[:]
        total_docs = len(all_docs)
        if total_docs == 0:
            return "No documents stored."

        RandomIndexs = random.sample(range(total_docs), min(10, total_docs))
        contentForTest = []
        for i in RandomIndexs:
            contentForTest.append(all_docs[i].page_content)
        return contentForTest
