import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import QuestionCard from './QuestionCard';

export default function ExamResults({ 
  score, 
  correctCount, 
  totalQuestions, 
  answers, 
  questions,
  onRetry,
  onHome 
}) {
  const [showReview, setShowReview] = useState(false);
  const percentage = Math.round((score / 100) * 100);
  const passed = score >= 70;

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-8 bg-white border-0 shadow-lg rounded-2xl text-center">
        <div className={cn(
          "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6",
          passed ? "bg-emerald-100" : "bg-red-100"
        )}>
          <Trophy className={cn(
            "w-12 h-12",
            passed ? "text-emerald-500" : "text-red-500"
          )} />
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Exam Complete
        </h2>
        
        <div className={cn(
          "text-6xl font-bold mb-4",
          passed ? "text-emerald-500" : "text-red-500"
        )}>
          {score}
        </div>
        <p className="text-slate-500 text-lg mb-6">out of 100 points</p>

        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{correctCount}</span>
            </div>
            <p className="text-slate-500 text-sm">Correct</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
              <XCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{totalQuestions - correctCount}</span>
            </div>
            <p className="text-slate-500 text-sm">Incorrect</p>
          </div>
        </div>

        <div className={cn(
          "inline-block px-6 py-2 rounded-full text-sm font-semibold mb-8",
          passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        )}>
          {passed ? "PASSED" : "NOT PASSED"} (Minimum: 70 points)
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={onHome}
            className="px-6"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            onClick={onRetry}
            className="bg-[#0A1628] hover:bg-[#1a2942] text-white px-6"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry Exam
          </Button>
        </div>
      </Card>

      {/* Review Toggle */}
      <Button
        variant="ghost"
        onClick={() => setShowReview(!showReview)}
        className="w-full justify-between p-4 h-auto bg-white shadow-md rounded-xl hover:bg-slate-50"
      >
        <span className="font-semibold text-slate-700">Review All Questions</span>
        {showReview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      {/* Question Review */}
      {showReview && (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              totalQuestions={totalQuestions}
              mode="study"
              selectedAnswer={answers[question.id]?.selected}
              showResult={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}