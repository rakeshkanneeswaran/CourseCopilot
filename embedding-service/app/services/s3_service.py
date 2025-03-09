import os
import boto3
import os

session = boto3.Session(
    aws_access_key_id="AKIAZOZQFQWQYVUHJSVG",
    aws_secret_access_key="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",
    region_name="ap-south-1",
)


s3_client = session.client("s3")


class S3Service:
    @staticmethod
    def download_file_from_s3(user_id, project_id):
        try:
            bucket_name = os.getenv("S3_BUCKET_NAME")
            files = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=f"{user_id}/{project_id}/original_content/transcripts/",
            )
            for each_file in files["Contents"]:
                if each_file["Key"].endswith(".json"):
                    s3_file_path = each_file["Key"]
                    print(f"Downloading file: {s3_file_path}")
                    local_file_directory = f"transcripts/{user_id}/{project_id}/original_content/transcripts"
                    os.makedirs(local_file_directory, exist_ok=True)
                    local_file_path = os.path.join(
                        local_file_directory, os.path.basename(s3_file_path)
                    )
                    s3_client.download_file(bucket_name, s3_file_path, local_file_path)
            final_path_to_transcripts = (
                f"transcripts/{user_id}/{project_id}/original_content/transcripts"
            )
            return final_path_to_transcripts
        except Exception as e:
            print(f"Error downloading file: {e}")

    @staticmethod
    def save_vectorstore_to_s3(local_folder, s3_prefix):
        """
        Uploads the vector store files (index.faiss and index.pkl) to S3.
        :param local_folder: Path to the local folder containing the vector store files.
        :param bucket_name: Name of the S3 bucket.
        :param s3_prefix: Prefix (folder path) in the S3 bucket where the files will be stored.
        """
        try:
            bucket_name = os.getenv("S3_BUCKET_NAME")
            # Upload index.faiss
            s3_client.upload_file(
                os.path.join(local_folder, "index.faiss"),
                bucket_name,
                os.path.join(s3_prefix, "index.faiss"),
            )
            print(
                f"Uploaded 'index.faiss' to 's3://{bucket_name}/{s3_prefix}/index.faiss'."
            )

            # Upload index.pkl
            s3_client.upload_file(
                os.path.join(local_folder, "index.pkl"),
                bucket_name,
                os.path.join(s3_prefix, "index.pkl"),
            )
            print(
                f"Uploaded 'index.pkl' to 's3://{bucket_name}/{s3_prefix}/index.pkl'."
            )

        except Exception as e:
            print(f"Error uploading files to S3: {e}")
