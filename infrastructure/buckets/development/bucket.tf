# S3 Bucket
resource "aws_s3_bucket" "eduverseai_production" {
  bucket = "eduverseai-production"
  tags = {
    Name        = "course-copilot"
    Environment = "Dev"
  }
}

# Disable Block Public Access
resource "aws_s3_bucket_public_access_block" "eduverseai_production_public_access_block" {
  bucket                  = aws_s3_bucket.eduverseai_production.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}


# Enable CORS for the S3 Bucket with wildcard origin
resource "aws_s3_bucket_cors_configuration" "eduverseai_production_cors" {
  bucket = aws_s3_bucket.eduverseai_production.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"] # Allows requests from any origin
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}


# Attach a Public Read Policy
resource "aws_s3_bucket_policy" "eduverseai_production_policy" {
  bucket = aws_s3_bucket.eduverseai_production.id

  # Explicitly depend on the public access block resource
  depends_on = [aws_s3_bucket_public_access_block.eduverseai_production_public_access_block]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::eduverseai-production/*"
      }
    ]
  })
}
