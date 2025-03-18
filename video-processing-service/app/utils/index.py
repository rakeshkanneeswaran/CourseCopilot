from loguru import logger
import os
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from dotenv import load_dotenv

load_dotenv()

session = boto3.Session(
    aws_access_key_id=os.getenv("aws_access_key_id"),
    aws_secret_access_key=os.getenv("aws_secret_access_key"),
    region_name=os.getenv("region_name"),
)
s3_client = session.client("s3")


def upload_to_s3(bucket_name: str, local_path: str, s3_key: str) -> bool:
    """
    Upload a file from a local path to an S3 bucket.

    Args:
        bucket_name (str): Name of the S3 bucket.
        local_path (str): Local path of the file to upload.
        s3_key (str): S3 key (path) where the file will be stored.

    Returns:
        bool: True if the upload was successful, False otherwise.
    """
    # s3_client = boto3.client("s3")
    try:
        logger.info(f"Uploading {local_path} to S3 bucket {bucket_name} at {s3_key}")
        s3_client.upload_file(local_path, bucket_name, s3_key)
        logger.info("Upload successful")
        return True
    except FileNotFoundError:
        logger.error(f"The local file {local_path} does not exist.")
        return False
    except NoCredentialsError:
        logger.error("No AWS credentials found.")
        return False
    except PartialCredentialsError:
        logger.error("Incomplete AWS credentials provided.")
        return False
    except ClientError as e:
        logger.error(f"S3 Client Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False


def download_from_s3(bucket_name: str, s3_key: str, local_path: str) -> bool:
    # s3_client = boto3.client("s3")
    try:
        logger.info(
            f"Downloading {s3_key} from S3 bucket {bucket_name} to {local_path}"
        )
        s3_client.download_file(bucket_name, s3_key, local_path)
        logger.info("Download successful")
        return True
    except FileNotFoundError:
        logger.error(f"The local path {local_path} does not exist.")
        return False
    except NoCredentialsError:
        logger.error("No AWS credentials found.")
        return False
    except PartialCredentialsError:
        logger.error("Incomplete AWS credentials provided.")
        return False
    except ClientError as e:
        logger.error(f"S3 Client Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False
