def format_transcriptions(transcriptions):
    formatted = []
    for transcription in transcriptions:
        formatted_entry = {
            "id": transcription["id"],
            "start_time": f"{transcription['start']:.2f}s",
            "end_time": f"{transcription['end']:.2f}s",
            "text": transcription["text"],
            "confidence": transcription.get("confidence", "N/A"),
        }
        formatted.append(formatted_entry)
    return formatted