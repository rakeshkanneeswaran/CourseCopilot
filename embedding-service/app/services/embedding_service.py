from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.file_service import FileService
import json

embeddings = OllamaEmbeddings(model="llama3")

text_splitter = RecursiveCharacterTextSplitter(
    # Set a really small chunk size, just to show.
    chunk_size=100,
    chunk_overlap=20,
    length_function=len,
    is_separator_regex=False,
)


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

    @staticmethod
    def load_json_file_and_transform(file_path):
        filesArray = FileService.list_files(file_path)
        print("this the files array", filesArray)
        print("this is file path", file_path)
        text = ""

        for file in filesArray:
            with open(file, "r") as f:
                data = json.load(f)
                for item in data:
                    text += item["text"]
        textArray = text_splitter.split_text(text)
        return textArray
