"use client";

import { useState } from "react";

interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: string;
  explanation: string;
}

interface McqQuestions {
  questions: Question[];
}

export default function MCQTest({ questions }: McqQuestions) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [showResults, setShowResults] = useState(false);

  const [, setReviewMode] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => setShowResults(true);

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setReviewMode(false);
  };

  const handleReview = () => {
    setReviewMode(true);
    setShowResults(false);
    setCurrentQuestionIndex(0);
  };

  const calculateScore = () => {
    return questions.reduce(
      (score, question, index) =>
        selectedAnswers[index] === question.correct_option ? score + 1 : score,
      0
    );
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="bg-[#faf8f4] rounded-lg text-black shadow-lg overflow-hidden">
      {showResults ? (
        <ResultsScreen
          score={score}
          totalQuestions={questions.length}
          percentage={percentage}
          handleRestart={handleRestart}
          handleReview={handleReview}
        />
      ) : (
        <QuestionScreen
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          handleOptionSelect={handleOptionSelect}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  handleOptionSelect,
  handleNext,
  handlePrevious,
  handleSubmit,
}: {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer?: string;
  handleOptionSelect: (option: string) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: () => void;
}) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{`Question ${
        questionIndex + 1
      } of ${totalQuestions}`}</h2>
      <p className="text-lg">{question.question}</p>

      <div className="mt-4 space-y-3">
        {Object.entries(question.options).map(([key, value]) => (
          <RadioOption
            key={key}
            option={key}
            label={value}
            checked={selectedAnswer === key}
            onChange={handleOptionSelect}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={questionIndex === 0}
          variant="outline"
        >
          Previous
        </Button>
        {questionIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext} disabled={!selectedAnswer}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!selectedAnswer}>
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({
  score,
  totalQuestions,
  percentage,
  handleRestart,
  handleReview,
}: {
  score: number;
  totalQuestions: number;
  percentage: number;
  handleRestart: () => void;
  handleReview: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold">Test Results</h2>
      <p className="mt-2 text-lg">
        You scored {score} out of {totalQuestions} ({percentage}%)
      </p>

      <div className="mt-6 flex justify-center gap-4">
        <Button onClick={handleRestart} variant="outline">
          Restart Test
        </Button>
        <Button onClick={handleReview}>Review Answers</Button>
      </div>
    </div>
  );
}

function RadioOption({
  option,
  label,
  checked,
  onChange,
}: {
  option: string;
  label: string;
  checked: boolean;
  onChange: (option: string) => void;
}) {
  return (
    <label
      className={`flex items-center p-3 rounded-lg border ${
        checked
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        value={option}
        checked={checked}
        onChange={() => onChange(option)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span className="ml-2">
        {option}. {label}
      </span>
    </label>
  );
}

function Button({
  onClick,
  disabled,
  variant = "primary",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline";
  children: React.ReactNode;
}) {
  const baseClasses =
    "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 transition-colors";
  const variantClasses =
    variant === "outline"
      ? "border border-gray-300 text-gray-700 bg-[#c05e3c] focus:ring-blue-500"
      : "bg-[#c05e3c] text-white hover:bg-[#c05e3c] focus:ring-blue-500";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
