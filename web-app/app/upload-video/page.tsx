"use client";

import { useState } from "react";
import { uploadVideo } from "./actions";

export default function VideoUploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Show video preview
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

    if (success) {
      alert("Video uploaded successfully!");
    } else {
      alert("Upload failed. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Your Video</h1>

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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Video"}
      </button>
    </div>
  );
}
