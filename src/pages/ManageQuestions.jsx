import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Search, Loader2, GripVertical, Trash2 } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ManageQuestions() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const data = await base44.entities.Question.list();
      return data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
    }
  });

  const topics = useMemo(() => {
    const topicSet = new Set(questions.map(q => q.topic));
    return ['all', ...Array.from(topicSet)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;
      const matchesSearch = !searchQuery || 
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [questions, selectedTopic, searchQuery]);

  const handleDragEnd = async (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    
    const items = Array.from(filteredQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Optimistically update the UI
    queryClient.setQueryData(['questions'], (old = []) => {
      const updated = [...old];
      items.forEach((item, index) => {
        const questionIndex = updated.findIndex(q => q.id === item.id);
        if (questionIndex !== -1) {
          updated[questionIndex] = { ...updated[questionIndex], display_order: index };
        }
      });
      return updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });
    
    // Update only affected questions sequentially to avoid rate limits
    const start = Math.min(result.source.index, result.destination.index);
    const end = Math.max(result.source.index, result.destination.index);
    
    for (let i = start; i <= end; i++) {
      await base44.entities.Question.update(items[i].id, { display_order: i });
    }
  };

  const handleDelete = async (questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteMutation.mutate(questionId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A572] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#0A1628] to-[#1a2942] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Manage Questions</h1>
              <p className="text-slate-300 text-sm">{questions.length} questions total</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => window.location.href = createPageUrl('Home')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic === 'all' ? 'All Topics' : topic}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Questions List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {filteredQuestions.map((question, index) => (
                    <Draggable key={question.id} draggableId={String(question.id)} index={index}>
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div {...provided.dragHandleProps} className="pt-1">
                              <GripVertical className="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-slate-500">
                                  #{index + 1}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                                  {question.topic}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium truncate">
                                {question.question_text}
                              </p>
                              <div className="flex gap-2 mt-2 text-xs text-slate-500">
                                <span>Correct: {question.correct_answer}</span>
                                {question.question_image && <span>• Has question image</span>}
                                {(question.option_a_image || question.option_b_image || 
                                  question.option_c_image || question.option_d_image) && 
                                  <span>• Has option images</span>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(question.id)}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                asChild
                                className="bg-[#0A1628] hover:bg-[#1a2942] text-white"
                              >
                                <Link to={`${createPageUrl('QuestionEditor')}?id=${question.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </main>
    </div>
  );
}