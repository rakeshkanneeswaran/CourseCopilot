import os
import boto3
import os


s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_DEFAULT_REGION"),
)


def download_file_from_s3(user_id, project_id):
    try:
        print("{user_id}/{project_id}/original_content/transcripts/{project_id}_1.mp4")
        bucket_name = os.getenv("S3_BUCKET_NAME")
        s3_file_path = (
            f"{user_id}/{project_id}/original_content/transcripts/{project_id}_1.mp4"
        )
        local_file_path = f"transcripts/{user_id}/{project_id}/{project_id}_1.mp4"
        s3_client.download_file(bucket_name, s3_file_path, local_file_path)
        print(f"File downloaded: {local_file_path}")
    except Exception as e:
        print(f"Error downloading file: {e}")


def save_vectorstore_to_s3(local_folder, bucket_name, s3_prefix):
    """
    Uploads the vector store files (index.faiss and index.pkl) to S3.
    :param local_folder: Path to the local folder containing the vector store files.
    :param bucket_name: Name of the S3 bucket.
    :param s3_prefix: Prefix (folder path) in the S3 bucket where the files will be stored.
    """
    try:
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
        print(f"Uploaded 'index.pkl' to 's3://{bucket_name}/{s3_prefix}/index.pkl'.")

    except Exception as e:
        print(f"Error uploading files to S3: {e}")
