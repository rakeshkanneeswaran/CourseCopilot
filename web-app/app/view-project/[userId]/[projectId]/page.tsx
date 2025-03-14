"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import MCQTest from "@/app/components/mcq-model";
import {
  getOriginalContent,
  getContentForDifferentLanguage,
  getProjectDetails,
  getMcqQuestions,
} from "./action";

interface McqQuestions {
  questions: {
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correct_option: string;
    explanation: string;
  }[];
}

interface VideoTranscriptMap {
  videoUrl: string;
  transcriptUrl: string;
}

interface VideoTranscript {
  id: number;
  start_time: string;
  end_time: string;
  text: string;
}

export default function Page() {
  const { projectId, userId } = useParams() as {
    projectId: string;
    userId: string;
  };

  const [selectedContent, setSelectedContent] =
    useState<VideoTranscriptMap | null>(null);
  const [projectContent, setProjectContent] = useState<VideoTranscriptMap[]>(
    []
  );
  const [videoIndex, setVideoIndex] = useState(0);
  const [selectedVideoTranscript, setSelectedVideoTranscript] =
    useState<string>("");

  const [selectedLanguage, setSelectedLanguage] = useState<string>("Original");
  const [availableLanguage, setAvailableLanguage] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [messageFromIntellignece, setMessageFromIntellignece] =
    useState<string[]>();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestions>();
  const [isMcqPopupOpen, setIsMcqPopupOpen] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageFromIntellignece]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (ws) {
      ws.send(JSON.stringify({ request_type: "query", query: inputValue }));
    }
    setInputValue("");
  };

  useEffect(() => {
    console.log(
      `${process.env.NEXT_PUBLIC_AI_WEB_SOCKET_URL!}/${userId}/${projectId}`
    );
    console.log(`${process.env.NEXT_PUBLIC_LODALASEN!}/${userId}/${projectId}`);

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_AI_WEB_SOCKET_URL!}/${userId}/${projectId}`
    );
    socket.onopen = () => {
      console.log("Connected to server");
    };
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setMessageFromIntellignece((prev) => {
        return [...(prev || []), data.text];
      });
    };
    setWs(socket);
    return () => {
      socket.close();
    };
  }, [projectId, userId]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectDetails = await getProjectDetails({ userId, projectId });
        if (projectDetails.projectMetaData.languages.length > 0) {
          setAvailableLanguage([
            ...projectDetails.projectMetaData.languages,
            "Original",
          ]);
        }
      } catch (error) {
        console.error("Error fetching project details", error);
      }
    };

    if (userId && projectId) {
      fetchProjectDetails();
    }
  }, [userId, projectId]);

  useEffect(() => {
    if (!userId || !projectId) return;
    const fetchProjects = async () => {
      try {
        console.log(projectId, userId);
        const content = await getOriginalContent({ userId, projectId });
        console.log("Content fetched");
        console.log(content);
        if (content.length) {
          setProjectContent(content);
          setSelectedContent(content[0]);
        }
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchProjects();
  }, [userId, projectId]);

  useEffect(() => {
    const fetchMcqQuestions = async () => {
      try {
        if (isMcqPopupOpen) {
          if (!mcqQuestions) {
            const questions = await getMcqQuestions({ userId, projectId });
            setMcqQuestions(questions);
          }
        }
      } catch (error) {
        console.error("Error fetching MCQ questions", error);
      }
    };
    if (userId && projectId) {
      fetchMcqQuestions();
    }
  }, [userId, projectId, isMcqPopupOpen]);

  useEffect(() => {
    const setContentLanguage = async () => {
      try {
        let content;
        if (selectedLanguage === "Original") {
          content = await getOriginalContent({ userId, projectId });
        } else {
          content = await getContentForDifferentLanguage({
            userId,
            projectId,
            languageName: selectedLanguage,
          });
        }

        if (content.length) {
          setProjectContent(content);
          setSelectedContent(content[0]);
        }
      } catch (error) {
        console.error("Error fetching content for different language", error);
      }
    };

    if (userId && projectId) {
      setContentLanguage();
    }
  }, [selectedLanguage, userId, projectId]);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!selectedContent || !selectedContent.transcriptUrl) {
        return;
      }
      const response = await fetch(selectedContent!.transcriptUrl);
      const data = (await response.json()) as VideoTranscript[];
      const transcript = transformTranscript({ transcriptArray: data });
      setSelectedVideoTranscript(transcript);
    };

    fetchTranscript();
  }, [selectedContent]);

  return (
    <div className="w-screen h-screen bg-[#faf8f4] flex flex-col items-center p-6  overflow-y-auto">
      {/* Main Content Area */}
      <div className="flex w-full px-20 space-x-6">
        {/* Left Side (Video + Transcript) */}
        <div className="w-2/3 flex flex-col">
          {/* Video */}
          {selectedContent && (
            <div className="bg-black p-1 rounded-lg shadow-lg flex justify-center">
              <video
                src={selectedContent.videoUrl}
                className="w-[900px] h-[450px] rounded-md"
                controls
              />
            </div>
          )}

          {/* Transcript */}
          <div className="mt-4 p-4 bg-[#eceae0] text-black rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">Transcript</h2>
            {selectedVideoTranscript ? (
              <p className="p-2 rounded-md shadow-sm">
                {selectedVideoTranscript}
              </p>
            ) : (
              <p className="text-gray-500">No transcript available.</p>
            )}
          </div>
        </div>

        {/* Right Side (AI chatboth) */}
        <div className="w-1/3 bg-[#f5f3eb] rounded-lg shadow-lg flex flex-col p-4">
          <p className="text-gray-400 italic text-center">Ask your doubt</p>

          {/* Messages appear from the top with spacing */}
          <div className="w-full h-72 p-2 text-black rounded-lg overflow-y-auto flex flex-col space-y-2">
            {messageFromIntellignece?.map((message, index) => (
              <p key={index} className="p-2 bg-[#e7e5db] rounded-md shadow-sm">
                {message}
              </p>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input box at the bottom */}
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center pt-64 gap-2 mt-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border border-gray-300 text-black rounded px-3 py-2 w-full"
              placeholder="Enter something"
            />
            <button
              type="submit"
              className="bg-[#c05e3c] hover:bg-[#a04d30] text-white px-4 py-2 rounded "
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-5 mt-6">
        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md disabled:opacity-50"
          disabled={videoIndex === 0}
          onClick={() => {
            setVideoIndex((prev) => prev - 1);
            setSelectedContent(projectContent[videoIndex - 1]);
          }}
        >
          Previous
        </button>

        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md disabled:opacity-50"
          disabled={videoIndex >= projectContent.length - 1}
          onClick={() => {
            setVideoIndex((prev) => prev + 1);
            setSelectedContent(projectContent[videoIndex + 1]);
          }}
        >
          Next
        </button>

        <button
          className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md"
          onClick={() => setShowOptions(true)}
        >
          Select Language
        </button>

        {videoIndex === projectContent.length - 1 && (
          <button
            className="px-4 py-2 font-bold bg-[#c05e3c] text-white rounded-md"
            onClick={() => setIsMcqPopupOpen(true)}
          >
            MCQ Test
          </button>
        )}
      </div>

      {/* Language Selection Modal */}
      {showOptions && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 text-center">
            <h2 className="text-lg font-semibold mb-4">Select Language</h2>
            {availableLanguage.map((language) => (
              <button
                key={language}
                className="block w-full py-2 px-4 my-2 bg-[#c05e3c] text-white rounded-md hover:bg-[#a04d30]"
                onClick={() => {
                  setSelectedLanguage(language);
                  setShowOptions(false);
                }}
              >
                {language}
              </button>
            ))}
            <button
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              onClick={() => setShowOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MCQ Test */}
      {isMcqPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-lg shadow-lg w-1/2 relative bg-white p-4">
            <button
              className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-full"
              onClick={() => setIsMcqPopupOpen(false)}
            >
              ✖
            </button>

            {mcqQuestions ? (
              <MCQTest questions={mcqQuestions.questions} />
            ) : (
              // If mcqQuestions is null, show loading screen
              <div className="flex flex-col items-center">
                <svg
                  aria-hidden="true"
                  className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="text-gray-600 mt-2">Loading...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function transformTranscript({
  transcriptArray,
}: {
  transcriptArray: VideoTranscript[];
}): string {
  try {
    return transcriptArray.map((transcript) => transcript.text).join(" ");
  } catch (error) {
    console.error("Error transforming transcript:", error);
    throw new Error("Failed to transform transcript");
  }
}
