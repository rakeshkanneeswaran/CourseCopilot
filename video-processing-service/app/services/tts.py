from google.cloud import texttospeech


def synthesize_speech(text, output_filename):
    client = texttospeech.TextToSpeechClient()
    input_text = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Wavenet-D",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    response = client.synthesize_speech(
        input=input_text, voice=voice, audio_config=audio_config
    )
    with open(output_filename, "wb") as out:
        out.write(response.audio_content)
    print(f"Audio content written to '{output_filename}'")


if __name__ == "__main__":
    synthesize_speech("Hello, world!", "output.mp3")
