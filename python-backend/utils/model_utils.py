import whisper_timestamped as whisper

model = whisper.load_model("base")  # Replace "tiny" with your desired model

def get_model():
    return model