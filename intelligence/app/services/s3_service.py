import os
import boto3


# Ensure AWS credentials are set
aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_DEFAULT_REGION")
s3_bucket_name = os.getenv("S3_BUCKET_NAME")


# Initialize Boto3 session
session = boto3.Session(
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key,
    region_name=aws_region,
)

s3_client = session.client("s3")


class S3Service:
    @staticmethod
    def get_vector_store_from_s3(user_id, project_id):
        try:
            s3_prefix = f"{user_id}/{project_id}/original_content/vectorestore/"
            response = s3_client.list_objects_v2(
                Bucket=s3_bucket_name, Prefix=s3_prefix
            )

            # Check if 'Contents' key exists (avoids KeyError)
            if "Contents" not in response or not response["Contents"]:
                print(f"No files found in S3 at prefix: {s3_prefix}")
                return None

            local_dir = f"vectorstore/{user_id}/{project_id}/"
            os.makedirs(
                local_dir, exist_ok=True
            )  # Creates directory only if it doesn't exist

            downloaded_files = []
            for file in response["Contents"]:
                s3_file_path = file["Key"]
                print(f"Downloading: {s3_file_path}")

                if s3_file_path.endswith(".faiss"):
                    local_file_path = os.path.join(local_dir, "index.faiss")
                elif s3_file_path.endswith(".pkl"):
                    local_file_path = os.path.join(local_dir, "index.pkl")
                else:
                    print(f"Skipping unknown file type: {s3_file_path}")
                    continue

                s3_client.download_file(s3_bucket_name, s3_file_path, local_file_path)
                downloaded_files.append(local_file_path)

            return downloaded_files if downloaded_files else None

        except Exception as e:
            print(f"❌ Error downloading files from S3: {e}")
            return None
