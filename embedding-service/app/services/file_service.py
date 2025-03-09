import os


class FileService:
    @staticmethod
    def delete_transcript_directory(userId, projectId):
        user_path = f"transcripts/{userId}/{projectId}"

        if os.path.exists(user_path) and os.path.isdir(user_path):
            # Delete all files and subdirectories
            for root, dirs, files in os.walk(user_path, topdown=False):
                for file in files:
                    os.remove(os.path.join(root, file))  # Delete each file
                for directory in dirs:
                    os.rmdir(os.path.join(root, directory))

            # Finally, delete the user directory
            os.rmdir(user_path)
            os.rmdir(f"transcripts/{userId}")
            print(f"Deleted everything related to '{userId}'.")
        else:
            print(f"User directory '{userId}' does not exist.")

    @staticmethod
    def list_files(directory):
        if os.path.exists(directory) and os.path.isdir(directory):
            filesArray = []
            files = os.listdir(directory)  # Get all files and folders
            for file in files:
                full_path = os.path.join(directory, file)
                if os.path.isfile(full_path):  # Check if it's a file
                    filesArray.append(full_path)
            return filesArray
        else:
            print(f"Directory '{directory}' does not exist.")
