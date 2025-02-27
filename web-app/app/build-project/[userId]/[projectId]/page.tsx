"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { uploadVideo } from "./actions";

export default function VideoUploadPage() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [translate, setTranslate] = useState(false);
  const [includeSubtitles, setIncludeSubtitles] = useState(false);
  const [generateTranscript, setGenerateTranscript] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const params = useParams();
  const projectId = params.projectId;
  const userId = params.userId;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setVideoFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [
        ...prev,
        ...files.map((file) => URL.createObjectURL(file)),
      ]);
    }
  };

  const handleUpload = async () => {
    if (videoFiles.length === 0) {
      alert("Please select at least one video first!");
      return;
    }

    setUploading(true);
    let position = 0;
    for (const videoFile of videoFiles) {
      if (
        !projectId ||
        !userId ||
        Array.isArray(projectId) ||
        Array.isArray(userId)
      ) {
        return;
      }
      position = position + 1;
      const newFileName = `${projectId}_${position}_.mp4`;
      const renamedFile = new File([videoFile], newFileName, {
        type: videoFile.type,
      });
      const formData = new FormData();
      formData.append("file", renamedFile);

      await uploadVideo(formData, { userId, projectId });
    }
    setUploading(false);
    alert("Videos uploaded successfully!");
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((lang) => lang !== language)
        : [...prev, language]
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6 gap-6">
      {/* Left Panel - Video Upload */}
      <div className="w-1/2 flex flex-col items-center border-r border-gray-300 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Upload Your Videos
        </h1>

        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Videos"}
        </Button>

        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="mt-4 mb-4"
        />

        <div className="grid grid-cols-3 gap-3 w-full">
          {previewUrls.map((url, index) => (
            <video
              key={index}
              src={url}
              controls
              className="w-32 h-32 rounded-lg shadow-md"
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Processing Options */}
      <div className="w-1/2 flex flex-col items-start p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Processing Options
        </h2>

        {/* Translation Toggle */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-gray-700">Translate Video</span>
          <Switch enabled={translate} onChange={setTranslate} />
        </div>

        {/* Language Selection */}
        {translate && (
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
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
                <span className="text-gray-700">{language}</span>
              </label>
            ))}
          </div>
        )}

        {/* Subtitles Toggle */}
        <div className="flex items-center justify-between w-full mt-6 mb-4">
          <span className="text-gray-700">Include Subtitles</span>
          <Switch enabled={includeSubtitles} onChange={setIncludeSubtitles} />
        </div>

        {/* Transcript Toggle */}
        <div className="flex items-center justify-between w-full">
          <span className="text-gray-700">Generate Transcript</span>
          <Switch
            enabled={generateTranscript}
            onChange={setGenerateTranscript}
          />
        </div>
      </div>
    </div>
  );
}

/* ✅ Custom Switch Component */
function Switch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`relative w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition ${
        enabled ? "bg-green-600" : "bg-gray-300"
      }`}
      onClick={() => onChange(!enabled)}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </div>
  );
}

/* ✅ Custom Button Component */
function Button({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 font-semibold text-white rounded-lg shadow-md 
        transition ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
    >
      {children}
    </button>
  );
}
