"use client";

import { useState } from "react";
import { userSignup } from "./action";
import { useRouter } from "next/navigation";

interface SignupData {
  username: string;
  password: string;
  name: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupData>({
    username: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await userSignup(formData);
      setSuccess("Signup successful!");
      router.push(`/login`);
    } catch (err) {
      setError("Signup failed. Please try again.");
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-[#faf8f4]">
      <div className="w-full max-w-md p-8 rounded-lg border border-black via-[#edd7cb] shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-black text-transparent bg-clip-text mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-700">Join us today!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-md border-2 text-black border-gray-300 focus:outline-none focus:border-black transition duration-300"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-md border-2 text-black border-gray-300 focus:outline-none focus:border-black transition duration-300"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-md border-2 text-black border-gray-300 focus:outline-none focus:border-black transition duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-3 px-4 rounded-md font-semibold text-white transition duration-300 bg-black hover:opacity-90"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

          <div className="mt-6 text-center text-sm text-gray-700">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-black font-semibold hover:opacity-80 transition duration-300"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
