import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopicSelector({ topics, onSelectTopic, onBack }) {
  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-slate-600 hover:text-slate-800 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Modes
      </Button>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Topic</h2>
        <p className="text-slate-500">Choose a topic to practice</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card
            key={topic.name}
            onClick={() => onSelectTopic(topic.name)}
            className={cn(
              "p-5 cursor-pointer transition-all duration-300 border-0 shadow-md hover:shadow-lg",
              "bg-white rounded-xl group hover:-translate-y-1"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#0A1628] transition-colors">
                <FolderOpen className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{topic.name}</h3>
                <p className="text-slate-500 text-sm">{topic.count} questions</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}