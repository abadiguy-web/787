import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import ImageUploadField from '@/components/ImageUploadField';

export default function QuestionEditor() {
  const queryClient = useQueryClient();
  
  // Get questionId from URL on mount
  const [questionId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  });
  
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const question = questions.find(q => q.id === questionId);
  
  const [formData, setFormData] = useState({
    topic: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    question_image: '',
    option_a_image: '',
    option_b_image: '',
    option_c_image: '',
    option_d_image: '',
    explanation_image: ''
  });

  useEffect(() => {
    if (question) {
      setFormData({
        topic: question.topic || '',
        question_text: question.question_text || '',
        option_a: question.option_a || '',
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        correct_answer: question.correct_answer || 'A',
        explanation: question.explanation || '',
        question_image: question.question_image || '',
        option_a_image: question.option_a_image || '',
        option_b_image: question.option_b_image || '',
        option_c_image: question.option_c_image || '',
        option_d_image: question.option_d_image || '',
        explanation_image: question.explanation_image || ''
      });
    }
  }, [question]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.update(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      window.location.href = createPageUrl('ManageQuestions');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Question.delete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      window.location.href = createPageUrl('ManageQuestions');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C5A572] animate-spin" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Question not found</p>
          <Button onClick={() => window.location.href = createPageUrl('ManageQuestions')}>
            Back to Questions
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#0A1628] to-[#1a2942] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Edit Question</h1>
            <Button
              variant="ghost"
              onClick={() => window.location.href = createPageUrl('ManageQuestions')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <ImageUploadField
            label="Question Image"
            imageUrl={formData.question_image}
            onImageChange={(url) => setFormData({ ...formData, question_image: url })}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Option A</label>
                <Input
                  value={formData.option_a}
                  onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                />
              </div>
              <ImageUploadField
                label="Option A Image"
                imageUrl={formData.option_a_image}
                onImageChange={(url) => setFormData({ ...formData, option_a_image: url })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Option B</label>
                <Input
                  value={formData.option_b}
                  onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                />
              </div>
              <ImageUploadField
                label="Option B Image"
                imageUrl={formData.option_b_image}
                onImageChange={(url) => setFormData({ ...formData, option_b_image: url })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Option C</label>
                <Input
                  value={formData.option_c || ''}
                  onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                />
              </div>
              <ImageUploadField
                label="Option C Image"
                imageUrl={formData.option_c_image}
                onImageChange={(url) => setFormData({ ...formData, option_c_image: url })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Option D</label>
                <Input
                  value={formData.option_d || ''}
                  onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                />
              </div>
              <ImageUploadField
                label="Option D Image"
                imageUrl={formData.option_d_image}
                onImageChange={(url) => setFormData({ ...formData, option_d_image: url })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
            <select
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Explanation (Optional)</label>
            <Textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <ImageUploadField
            label="Explanation Image"
            imageUrl={formData.explanation_image}
            onImageChange={(url) => setFormData({ ...formData, explanation_image: url })}
          />

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 bg-[#0A1628] hover:bg-[#1a2942] text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}