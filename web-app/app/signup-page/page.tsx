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
      const result = await userSignup(formData);

      setSuccess("Signup successful!");
      router.push(`/dashboard/${result.userId}`);
    } catch (err) {
      setError("Signup failed. Please try again.");
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-white text-black font-semibold rounded hover:bg-gray-300"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      </div>
    </div>
  );
}
