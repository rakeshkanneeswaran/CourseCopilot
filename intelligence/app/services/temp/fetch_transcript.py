def _fetch_lecture_transcript_from_s3(self, project_id, lecture_id):
    """Fetch lecture transcript directly from S3 with efficient processing"""
    try:
        s3_client = boto3.client('s3')
        s3_bucket = "your-bucket-name"
        s3_key = f"projects/{project_id}/lectures/{lecture_id}/transcript.json"
        
        # Use streaming to handle large files efficiently
        response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        
        # For large files, process the stream in chunks
        chunk_size = 1024 * 1024  # 1MB chunks
        body = response['Body']
        
        # Use a streaming approach for large files
        chunks = []
        for chunk in iter(lambda: body.read(chunk_size), b''):
            chunks.append(chunk)
        
        data = b''.join(chunks).decode('utf-8')
        transcript_data = json.loads(data)
        
        # Build the full text with a StringBuilder-like approach for efficiency
        from io import StringIO
        buffer = StringIO()
        
        for segment in transcript_data:
            buffer.write(segment.get("text", "") + " ")
        
        return buffer.getvalue()
    except Exception as e:
        print(f"Error fetching transcript from S3: {e}")
        return "Failed to retrieve lecture content."