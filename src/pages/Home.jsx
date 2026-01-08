import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plane, Settings, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import PasteDataImporter from '@/components/PasteDataImporter';
import ModeSelector from '@/components/ModeSelector';
import TopicSelector from '@/components/TopicSelector';
import QuestionCard from '@/components/QuestionCard';
import ExamResults from '@/components/ExamResults';
import QuestionImportExport from '@/components/QuestionImportExport';

export default function Home() {
  const queryClient = useQueryClient();
  
  // Check if user has entered the access code
  React.useEffect(() => {
    const hasAccess = sessionStorage.getItem('787_access');
    if (!hasAccess) {
      window.location.href = createPageUrl('EnterCode');
    }
  }, []);
  
  const [view, setView] = useState('home'); // home, upload, topic-select, practice
  const [mode, setMode] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState([]);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Question.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['questions'])
  });

  // Get unique topics with counts
  const topics = useMemo(() => {
    const topicMap = {};
    questions.forEach(q => {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = 0;
      }
      topicMap[q.topic]++;
    });
    return Object.entries(topicMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [questions]);

  const starredQuestions = useMemo(() => 
    questions.filter(q => q.is_starred),
    [questions]
  );

  // Shuffle array helper
  const shuffleArray = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setExamSubmitted(false);

    if (selectedMode === 'exam') {
      // Select 25 random questions from all topics
      const shuffled = shuffleArray(questions).slice(0, 25);
      setPracticeQuestions(shuffled);
      setView('practice');
    } else if (selectedMode === 'starred') {
      if (starredQuestions.length === 0) {
        setPracticeQuestions([]);
        setView('practice');
      } else {
        setPracticeQuestions(shuffleArray(starredQuestions));
        setView('practice');
      }
    } else {
      setView('topic-select');
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    const topicQuestions = questions.filter(q => q.topic === topic);
    // Keep original order for study mode, shuffle for practice mode
    setPracticeQuestions(mode === 'study' ? topicQuestions : shuffleArray(topicQuestions));
    setView('practice');
  };

  const handleSelectAnswer = (displayLabel, originalLetter) => {
    const currentQuestion = practiceQuestions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { selected: displayLabel, original: originalLetter }
    }));
    
    if (mode !== 'exam') {
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowResult(mode !== 'exam' && !!answers[practiceQuestions[currentQuestionIndex - 1]?.id]);
    }
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
  };

  const handleToggleStar = async (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateMutation.mutate({ 
        id: questionId, 
        data: { is_starred: !question.is_starred }
      });
    }
  };

  const handleRetry = () => {
    if (mode === 'exam') {
      const shuffled = shuffleArray(questions).slice(0, 25);
      setPracticeQuestions(shuffled);
    }
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setExamSubmitted(false);
  };

  const handleHome = () => {
    setView('home');
    setMode(null);
    setSelectedTopic(null);
    setPracticeQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setExamSubmitted(false);
  };

  // Calculate exam score
  const examScore = useMemo(() => {
    if (!examSubmitted) return null;
    let correct = 0;
    practiceQuestions.forEach(q => {
      const answer = answers[q.id];
      if (answer && answer.original === q.correct_answer) {
        correct++;
      }
    });
    return {
      correct,
      total: practiceQuestions.length,
      score: correct * 4
    };
  }, [examSubmitted, answers, practiceQuestions]);

  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const isQuestionStarred = currentQuestion ? questions.find(q => q.id === currentQuestion.id)?.is_starred : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A572] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0A1628] to-[#1a2942] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleHome}>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Plane className="w-6 h-6 text-[#C5A572]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Boeing 787 Exam Prep</h1>
                <p className="text-slate-300 text-sm">RAT״A Closed Book Practice</p>
              </div>
            </div>
            {questions.length > 0 && view === 'home' && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = createPageUrl('ManageQuestions')}
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Questions
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView('upload')}
                  className="text-white hover:bg-white/10"
                >
                  Import More
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Home View */}
        {view === 'home' && questions.length === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, Captain</h2>
              <p className="text-slate-500">Upload your question bank to get started</p>
            </div>
            <PasteDataImporter 
              onImportComplete={() => queryClient.invalidateQueries(['questions'])}
              existingQuestions={questions}
            />
            <QuestionImportExport
              questions={questions}
              onImportComplete={() => queryClient.invalidateQueries(['questions'])}
            />
          </div>
        )}

        {view === 'home' && questions.length > 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Practice Mode</h2>
              <p className="text-slate-500">{questions.length} questions across {topics.length} topics</p>
            </div>
            <ModeSelector 
              onSelectMode={handleSelectMode}
              starredCount={starredQuestions.length}
            />
            <QuestionImportExport
              questions={questions}
              onImportComplete={() => queryClient.invalidateQueries(['questions'])}
            />
          </div>
        )}

        {/* Upload View */}
        {view === 'upload' && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={handleHome}
              className="text-slate-600 hover:text-slate-800 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <PasteDataImporter 
              onImportComplete={() => queryClient.invalidateQueries(['questions'])}
              existingQuestions={questions}
            />
            <QuestionImportExport
              questions={questions}
              onImportComplete={() => queryClient.invalidateQueries(['questions'])}
            />
          </div>
        )}

        {/* Topic Selection */}
        {view === 'topic-select' && (
          <TopicSelector 
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onBack={handleHome}
          />
        )}

        {/* Practice View */}
        {view === 'practice' && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={handleHome}
              className="text-slate-600 hover:text-slate-800 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            {/* Empty starred state */}
            {mode === 'starred' && practiceQuestions.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-4xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Starred Questions</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  No starred questions yet. Star questions during practice to review them here.
                </p>
              </div>
            )}

            {/* Exam Results */}
            {mode === 'exam' && examSubmitted && examScore && (
              <ExamResults
                score={examScore.score}
                correctCount={examScore.correct}
                totalQuestions={examScore.total}
                answers={answers}
                questions={practiceQuestions}
                onRetry={handleRetry}
                onHome={handleHome}
              />
            )}

            {/* Study Mode - Show all questions */}
            {mode === 'study' && practiceQuestions.length > 0 && (
              <div className="space-y-6">
                {practiceQuestions.map((q, index) => {
                  const isStarred = questions.find(question => question.id === q.id)?.is_starred;
                  return (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      questionNumber={index + 1}
                      totalQuestions={practiceQuestions.length}
                      mode="study"
                      onToggleStar={handleToggleStar}
                      showResult={true}
                      isStarred={isStarred}
                    />
                  );
                })}
                <Button
                  onClick={handleHome}
                  className="w-full bg-[#0A1628] hover:bg-[#1a2942] text-white"
                >
                  Finish Study Session
                </Button>
              </div>
            )}

            {/* Question Card - Practice/Exam modes */}
            {mode !== 'study' && practiceQuestions.length > 0 && !examSubmitted && (
              <>
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={practiceQuestions.length}
                  mode={mode}
                  selectedAnswer={answers[currentQuestion?.id]?.selected}
                  onSelectAnswer={handleSelectAnswer}
                  onToggleStar={handleToggleStar}
                  showResult={showResult}
                  isStarred={isQuestionStarred}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-1">
                    {practiceQuestions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentQuestionIndex
                            ? 'bg-[#C5A572]'
                            : answers[practiceQuestions[idx]?.id]
                              ? 'bg-slate-400'
                              : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {currentQuestionIndex === practiceQuestions.length - 1 ? (
                    mode === 'exam' ? (
                      <Button
                        onClick={handleSubmitExam}
                        className="bg-[#C5A572] hover:bg-[#b39562] text-white px-6"
                      >
                        Submit Exam
                      </Button>
                    ) : (
                      <Button
                        onClick={handleHome}
                        className="bg-[#0A1628] hover:bg-[#1a2942] text-white px-6"
                      >
                        Finish
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={mode !== 'exam' && mode !== 'study' && !showResult}
                      className="bg-[#0A1628] hover:bg-[#1a2942] text-white px-6"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}