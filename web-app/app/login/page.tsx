"use client";

import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { userLogin } from "./action";
import { useRouter } from "next/navigation";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("calling userLogin");
      const result = await userLogin({
        username: formData.email,
        password: formData.password,
      });
      if (result.token) {
        console.log("setting token in local storage");
        console.log("this is the value of token", result.token);
        localStorage.setItem("token", result.token);
        router.push(`/dashboard`);
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-[#faf8f4]">
      <div className="w-full max-w-md p-8 rounded-lg border border-black via-[#edd7cb] shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-black text-transparent bg-clip-text mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-700">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 rounded-md border-2 text-black ${
                errors.email ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:border-black transition duration-300`}
            />
            {errors.email && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.email}
              </span>
            )}
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="block mb-2 font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 rounded-md border-2 text-black ${
                errors.password ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:border-black transition duration-300`}
            />
            {errors.password && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.password}
              </span>
            )}
          </div>

          <div className="text-right mb-5">
            <a
              href="#"
              className="text-black text-sm hover:opacity-80 transition duration-300"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className={`py-3 px-4 rounded-md font-semibold text-white transition duration-300 bg-black hover:opacity-90 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="mt-6 text-center text-sm text-gray-700">
            Do not have an account?{" "}
            <a
              href="/signup"
              className="text-black font-semibold hover:opacity-80 transition duration-300"
            >
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
