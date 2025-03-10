def _prepare_lecture_content(self, full_transcript, max_tokens=6000):
    """Prepare lecture content to fit within LLM context window"""
    # Roughly estimate token count (about 4 chars per token for English)
    estimated_tokens = len(full_transcript) / 4
    
    if estimated_tokens <= max_tokens:
        return full_transcript
    
    # Option 1: Simple truncation (not ideal but fast)
    # return full_transcript[:max_tokens * 4]
    
    # Option 2: Split into beginning, middle, and end sections
    third = max_tokens // 3
    beginning = full_transcript[:third * 4]
    middle_start = len(full_transcript) // 2 - (third * 2)
    middle = full_transcript[middle_start:middle_start + (third * 4)]
    end_start = len(full_transcript) - (third * 4)
    end = full_transcript[end_start:]
    
    return beginning + "\n...[content continues]...\n" + middle + "\n...[content continues]...\n" + end