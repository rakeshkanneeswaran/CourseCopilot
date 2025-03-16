from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from services.file_service import FileService
import json
import os

model_name = "BAAI/bge-small-en"


embeddings = HuggingFaceBgeEmbeddings(model_name=model_name)

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
        print(texts)
        vectorstore = FAISS.from_texts(texts, embedding=embeddings)
        print("Vectorstore created")
        return vectorstore

    @staticmethod
    def saveVectorStore(vectorstore, path):
        # Create directory if it does not exist
        if not os.path.exists(path):
            os.makedirs(path)
            print(f"Directory created at: {path}")
        else:
            print(f"Directory already exists at: {path}")

        print("Saving vectorstore at path:", path)
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
        text = ""
        for file in filesArray:
            with open(file, "r") as f:
                data = json.load(f)
                for item in data:
                    text += item["text"]
        textArray = text_splitter.split_text(text)
        return textArray
