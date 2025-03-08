"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadVideo, initiateBackground } from "./actions";
import { getUserId } from "@/app/action";

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
  const [userId, setUserId] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const userId = await getUserId({ token });
      setUserId(userId);
    };
    fetchUserId();
  }, [router]);

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
    try {
      if (videoFiles.length === 0) {
        alert("Please select at least one video first!");
        return;
      }

      setUploading(true);
      setProcessing(true); // Start processing
      setProgressValue(0); // Reset progress value

      const totalVideos = videoFiles.length;
      const progressIncrement = 100 / totalVideos;

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

        // Update progress value
        setProgressValue((prev) => prev + progressIncrement);
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

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await delay(3000);
      alert(
        "Videos uploaded successfully! , You will be notified when the processing is complete. or you can check the status in the dashboard"
      );
      setProcessing(false);
      setUploading(false);
      router.push(`/dashboard`);
    } catch (error) {
      console.error("Error uploading video", error);
      alert("Error uploading video . please try to recreate the project");
      router.push(`/dashboard`);
      setUploading(false);
      setProcessing(false);
    }
  };
  const handleLanguageChange = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((lang) => lang !== language)
        : [...prev, language]
    );
  };
  return (
    <div>
      <div className="flex min-h-screen bg-[#faf8f4] p-6 gap-6">
        {/* Left Panel - Video Upload */}

        <div className="w-2/3 flex flex-col items-center  bg-[#faf8f4] p-6 ">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Upload Your Videos
          </h1>

          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2  border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-200 border-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Only Video Files Allowed (MP4, AVI, MOV, etc.)
                </p>
              </div>
              <input
                id="dropzone-file" // <-- Added ID
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4  pt-2 overflow-y-scroll">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-[#f0efe7] p-4 rounded-lg shadow-md"
              >
                <video
                  src={url}
                  controls
                  className="w-48 h-48 rounded-lg"
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
        <div className="w-2/3 p-6  bg-[#f0efe7]   rounded-lg flex flex-col  space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            Processing Options
          </h2>

          {/* Gender Selection */}
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-700">Select Gender</span>
            <GenderToggle gender={gender} onChange={setGender} />
          </div>

          {/* Translation Toggle */}
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-700">Translate Video</span>
            <Switch enabled={translate} onChange={setTranslate} />
          </div>

          {/* Language Selection */}
          {translate && (
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Select Languages:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {["English", "Tamil", "French", "German"].map((language) => (
                  <label key={language} className="flex items-center space-x-2">
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
            </div>
          )}

          {/* Subtitles Toggle */}
          <div className="flex items-center justify-between w-full">
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

          {/* Upload Button */}
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Videos"}
          </Button>

          {/* Progress Bar */}
          {processing && (
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 text-xs font-medium text-white text-center h-full transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              >
                {`${Math.round(progressValue)}%`}
              </div>
            </div>
          )}
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
        enabled ? "bg-[#2a2a2b]" : "bg-gray-300"
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
          ? "bg-[#2a2a2b] cursor-not-allowed"
          : "bg-[#2a2a2b] hover:bg-black"
      }`}
    >
      {children}
    </button>
  );
}
