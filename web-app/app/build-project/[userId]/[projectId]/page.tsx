"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadVideo, initiateBackground } from "./actions";

export default function VideoUploadPage() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [translate, setTranslate] = useState(false);
  const [gender, setGender] = useState<string>("male"); // Default to male
  const [includeSubtitles, setIncludeSubtitles] = useState(false);
  const [generateTranscript, setGenerateTranscript] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const router = useRouter();
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
      const newFileName = `${projectId}_${position}.mp4`;
      const renamedFile = new File([videoFile], newFileName, {
        type: videoFile.type,
      });
      const formData = new FormData();
      formData.append("file", renamedFile);
      await uploadVideo(formData, { userId, projectId }, position);
    }

    const projectMetaData = {
      generate_translate: translate,
      generate_subtitle: includeSubtitles,
      languages: selectedLanguages,
      generate_transcript: generateTranscript,
      gender,
    };

    if (
      !projectId ||
      !userId ||
      Array.isArray(projectId) ||
      Array.isArray(userId)
    ) {
      return;
    }

    const result = await initiateBackground({
      userId,
      projectId,
      projectMetaData,
    });

    if (!result) {
      alert("Failed to initiate background process");
      return;
    }

    setUploading(false);
    alert(
      "Videos uploaded successfully! , You will be notified when the processing is complete. or you can check the status in the dashboard"
    );
    router.push(`/dashboard/${userId}`);
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
        <div className="flex flex-col gap-4">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg shadow-md"
            >
              <video
                src={url}
                controls
                className="w-48 h-48 rounded-lg shadow-lg"
                onLoadedMetadata={(e) => e.currentTarget.pause()}
                preload="metadata"
              />
              <div className="text-black flex flex-col font-semibold">
                Video file name: {videoFiles[index].name}
                <br />
                playlist order: {index + 1}
                <br />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Processing Options */}
      <div className="w-1/2 flex flex-col items-start p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Processing Options
        </h2>

        {/* Gender Selection */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-gray-700">Select Gender</span>
          <GenderToggle gender={gender} onChange={setGender} />
        </div>

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

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 className="text-xl font-bold mb-4">Upload Successful!</h2>
          <p>
            You will be notified when the processing is complete. You can also
            check the status in the dashboard.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </Modal>
      )}
    </div>
  );
}

function GenderToggle({
  gender,
  onChange,
}: {
  gender: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`relative w-20 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
        gender === "male" ? "bg-blue-500" : "bg-pink-500"
      }`}
      onClick={() => onChange(gender === "male" ? "female" : "male")}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
          gender === "male" ? "translate-x-0" : "translate-x-14"
        }`}
      />
      <span className="absolute left-2 text-white font-semibold">M</span>
      <span className="absolute right-2 text-white font-semibold">F</span>
    </div>
  );
}
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
        enabled ? "bg-red-500" : "bg-gray-300"
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

/* ✅ Custom Modal Component */
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {children}
        <button className="mt-4 text-red-500" onClick={onClose}>
          Close
        </button>
      </div>
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
      className={`px-4 py-2 font-semibold text-white rounded-lg shadow-md transition ${
        disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-700"
      }`}
    >
      {children}
    </button>
  );
}
