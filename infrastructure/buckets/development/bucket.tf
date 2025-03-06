resource "aws_s3_bucket" "course_copilot_ai_testing" {
  bucket = "course-copilot-ai-testing"
  tags = {
    Name        = "My bucket"
    Environment = "Dev"
  }
}

# Disable Block Public Access
resource "aws_s3_bucket_public_access_block" "course_copilot_ai_testing_public_access_block" {
  bucket                  = aws_s3_bucket.course_copilot_ai_testing.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Attach a Public Read Policy
resource "aws_s3_bucket_policy" "course_copilot_ai_testing_policy" {
  bucket = aws_s3_bucket.course_copilot_ai_testing.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::course-copilot-ai-testing/*"
    }
  ]
}
POLICY
}
