# eduverseai

## s3 storage structure

### location of original content:

```
userid/projectid/original_content/
    ├── videos/
    │   ├── 1.mp4
    │   ├── 2.mp4
    │   ├── 3.mp4
    ├── transcripts/
    │   ├── 1.json
    │   ├── 2.json
    │   ├── 3.json
```

### location of processed content:

```
userid/projectid/processed/language_name/
    ├── videos/
    │   ├── 1.mp4
    │   ├── 2.mp4
    │   ├── 3.mp4
    ├── transcripts/
    │   ├── 1.json
    │   ├── 2.json
    │   ├── 3.json
```

### notes:

- all folder and file names are in lowercase for consistency.
- this structure organizes original and processed content efficiently by user, project, and language.
