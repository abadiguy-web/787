import React from 'react';
import { Card } from "@/components/ui/card";
import { BookOpen, Target, Star, ClipboardCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  {
    id: 'study',
    title: 'Open Study Mode',
    description: 'View all questions with answers visible. Perfect for initial learning.',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'practice',
    title: 'Normal Practice',
    description: 'Answer questions one at a time with immediate feedback.',
    icon: Target,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'starred',
    title: 'Starred Questions',
    description: 'Review questions you have marked for later study.',
    icon: Star,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'exam',
    title: 'Final Exam Mode',
    description: '25 random questions. No feedback until submission. 4 points each.',
    icon: ClipboardCheck,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50'
  }
];

export default function ModeSelector({ onSelectMode, starredCount }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isStarred = mode.id === 'starred';
        
        return (
          <Card
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={cn(
              "p-6 cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl",
              "bg-white rounded-2xl group hover:-translate-y-1"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                "bg-gradient-to-br", mode.color
              )}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-lg">{mode.title}</h3>
                  {isStarred && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      {starredCount}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-1">{mode.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}