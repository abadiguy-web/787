import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  mode, // 'study' | 'practice' | 'exam'
  selectedAnswer,
  onSelectAnswer,
  onToggleStar,
  showResult,
  isStarred
}) {
  // Randomize options but keep track of correct answer
  const shuffledOptions = useMemo(() => {
    const options = [
      { letter: 'A', text: question.option_a },
      { letter: 'B', text: question.option_b },
      { letter: 'C', text: question.option_c },
      { letter: 'D', text: question.option_d }
    ].filter(opt => opt.text && opt.text.trim());
    
    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }, [question.id]);

  const correctLetter = question.correct_answer;
  const displayLabels = ['A', 'B', 'C', 'D'].slice(0, shuffledOptions.length);

  const getOptionStyle = (option, displayLabel) => {
    const isCorrect = option.letter === correctLetter;
    const isSelected = selectedAnswer === displayLabel;
    
    if (mode === 'study') {
      if (isCorrect) {
        return 'bg-emerald-50 border-emerald-500 text-emerald-900';
      }
      return 'bg-white border-slate-200 text-slate-700';
    }
    
    if (showResult) {
      if (isCorrect) {
        return 'bg-emerald-50 border-emerald-500 text-emerald-900';
      }
      if (isSelected && !isCorrect) {
        return 'bg-red-50 border-red-500 text-red-900';
      }
    }
    
    if (isSelected) {
      return 'bg-slate-100 border-slate-400 text-slate-900';
    }
    
    return 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50';
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A1628] to-[#1a2942] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C5A572] font-semibold text-sm tracking-wide">
            QUESTION {questionNumber} OF {totalQuestions}
          </span>
          <span className="text-slate-400 text-sm">•</span>
          <span className="text-slate-300 text-sm">{question.topic}</span>
        </div>
        {mode !== 'exam' && (
          <button
            onClick={() => onToggleStar?.(question.id)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                isStarred ? "fill-[#C5A572] text-[#C5A572]" : "text-slate-400"
              )}
            />
          </button>
        )}
      </div>

      {/* Question Content */}
      <div className="p-6 space-y-6">
        <p className="text-lg text-slate-800 leading-relaxed font-medium">
          {question.question_text}
        </p>

        {question.question_image && (
          <div className="flex justify-center cursor-pointer" onClick={() => window.open(question.question_image, '_blank')}>
            <img
              src={question.question_image}
              alt="Question illustration"
              className="max-w-full max-h-80 object-contain rounded-lg border border-slate-200 hover:shadow-lg transition-shadow"
            />
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3">
          {shuffledOptions.map((option, index) => {
            const displayLabel = displayLabels[index];
            const isCorrect = option.letter === correctLetter;
            const isSelected = selectedAnswer === displayLabel;
            const optionImageKey = `option_${option.letter.toLowerCase()}_image`;
            const optionImage = question[optionImageKey];
            
            return (
              <button
                key={option.letter}
                onClick={() => mode !== 'study' && !showResult && onSelectAnswer?.(displayLabel, option.letter)}
                disabled={mode === 'study' || showResult}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  getOptionStyle(option, displayLabel),
                  mode !== 'study' && !showResult && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    mode === 'study' && isCorrect ? "bg-emerald-500 text-white" :
                    showResult && isCorrect ? "bg-emerald-500 text-white" :
                    showResult && isSelected && !isCorrect ? "bg-red-500 text-white" :
                    isSelected ? "bg-slate-700 text-white" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {showResult && isCorrect ? <Check className="w-4 h-4" /> :
                     showResult && isSelected && !isCorrect ? <X className="w-4 h-4" /> :
                     displayLabel}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </div>
                {optionImage && (
                  <div className="mt-3 flex justify-center cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    window.open(optionImage, '_blank');
                  }}>
                    <img
                      src={optionImage}
                      alt={`Option ${displayLabel} illustration`}
                      className="max-w-full max-h-48 object-contain rounded-lg border border-slate-200 hover:shadow-lg transition-shadow"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {(mode === 'study' || showResult) && question.explanation && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-800 mb-1">Explanation</p>
            <p className="text-amber-900">{question.explanation}</p>
            {question.explanation_image && (
              <div className="mt-3 flex justify-center cursor-pointer" onClick={() => window.open(question.explanation_image, '_blank')}>
                <img
                  src={question.explanation_image}
                  alt="Explanation illustration"
                  className="max-w-full max-h-64 object-contain rounded-lg border border-amber-300 hover:shadow-lg transition-shadow"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}