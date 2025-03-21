"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-r from-[#e9e6dc] via-[#edd7cb] to-[#edd7cb] min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl text-center px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#333] mb-6 leading-tight tracking-tight">
          Unlock the Pinnacle of Educational Excellence with AI Precision
        </h1>
        <p className="text-xl md:text-2xl text-[#555] leading-relaxed mb-8">
          Transform your educational content into a masterpiece of global
          accessibility and interactive learning. Experience seamless AI-driven
          translation, meticulous transcription, intelligent test crafting, and
          an ever-present AI companion tailored to each course.
        </p>
      </div>

      <div className="mt-12 text-3xl font-semibold text-[#333] tracking-wide">
        Exclusive Preview
      </div>

      <div className="mt-8 w-full max-w-4xl">
        <video
          className="w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          src="https://eduverseai-production.s3.ap-south-1.amazonaws.com/demo-video.mov"
          autoPlay
          muted
          loop
          playsInline
        ></video>
      </div>

      <div className="mt-16 text-center space-x-4">
        <button
          className="bg-black  text-white text-lg font-bold tracking-wide py-3 px-8 rounded-full shadow-md transition-colors duration-300"
          onClick={() => {
            router.push("/login");
          }}
        >
          Login as Creator
        </button>
        <button
          className="bg-black text-white text-lg font-bold tracking-wide py-3 px-8 rounded-full shadow-md transition-colors duration-300"
          onClick={() => {
            router.push("/login-participants");
          }}
        >
          Login as Participant
        </button>
      </div>
    </div>
  );
}
