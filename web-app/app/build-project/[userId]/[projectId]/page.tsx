"use client";

import { useState } from "react";
import { uploadVideo } from "./actions";

export default function VideoUploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generateTranscript, setGenerateTranscript] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      alert("Please select a video first!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", videoFile);
    const success = await uploadVideo(formData);
    setUploading(false);
    alert(
      success ? "Video uploaded successfully!" : "Upload failed. Try again."
    );
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((lang) => lang !== language)
        : [...prev, language]
    );
  };

  return (
    <div className="flex min-h-screen bg-green-50 p-6">
      {/* Left Side - Video Upload */}
      <div className="w-1/2 flex flex-col items-center border-r-2 border-green-300 p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          Upload Your Video
        </h1>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        {previewUrl && (
          <video src={previewUrl} controls className="w-full max-w-lg mb-4" />
        )}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </div>

      {/* Right Side - Transcript & Language Selection */}
      <div className="w-1/2 flex flex-col items-center p-6">
        <h2 className="text-xl font-bold text-green-700 mb-4">
          Transcript Options
        </h2>
        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={generateTranscript}
            onChange={() => setGenerateTranscript(!generateTranscript)}
            className="accent-green-600"
          />
          <span className="text-green-700">Generate Transcript</span>
        </label>

        {generateTranscript && (
          <div className="w-full">
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Select Languages:
            </h3>
            {["English", "Spanish", "French", "German"].map((language) => (
              <label
                key={language}
                className="flex items-center space-x-2 mb-2"
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(language)}
                  onChange={() => handleLanguageChange(language)}
                  className="accent-green-600"
                />
                <span className="text-green-700">{language}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
