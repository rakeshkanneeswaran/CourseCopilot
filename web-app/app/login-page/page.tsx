"use client";
import type React from "react";
import { useState, type FormEvent } from "react";
import { userLogin } from "./action";
import { useRouter } from "next/navigation";

export default function Login() {
  return (
    <div className="app">
      <LoginPage />
    </div>
  );
}

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

function LoginPage() {
  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await userLogin({
        username: formData.email,
        password: formData.password,
      });
      if (result.status) {
        localStorage.setItem("userId", result.userId);
        router.push(`/dashboard/${result.userId}`);
        return true;
      }
      setIsSubmitting(false);
      return false;
    } catch (error) {
      console.error("Error logging in:", error);
      throw Error("Error logging");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-black">
      <div className="w-full max-w-md p-8 rounded-lg border border-green-500 bg-black shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-500 mb-2">
            Welcome Back
          </h1>
          <p className="text-white opacity-80">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 font-medium text-white"
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
              className={`w-full px-4 py-3 rounded-md bg-opacity-5 bg-white border-2 ${
                errors.email
                  ? "border-red-500"
                  : "border-white border-opacity-10"
              } text-white focus:outline-none focus:border-green-500 transition duration-300`}
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
              className="block mb-2 font-medium text-white"
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
              className={`w-full px-4 py-3 rounded-md bg-opacity-5 bg-white border-2 ${
                errors.password
                  ? "border-red-500"
                  : "border-white border-opacity-10"
              } text-white focus:outline-none focus:border-green-500 transition duration-300`}
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
              className="text-green-500 text-sm hover:opacity-80 transition duration-300"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className={`py-3 px-4 rounded-md font-semibold text-white transition duration-300 ${
              isSubmitting
                ? "bg-green-500 bg-opacity-60 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="mt-6 text-center text-sm text-white">
            Do not have an account?{" "}
            <a
              href="#"
              className="text-green-500 font-semibold hover:opacity-80 transition duration-300"
            >
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
