import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function QuestionImportExport({ questions, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        questions: questions
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boeing-787-questions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: `Exported ${questions.length} questions successfully!` });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to export questions.' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus({ type: 'loading', message: 'Importing questions...' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid file format. Expected questions array.');
      }

      // Filter out duplicates
      const existingTexts = new Set(questions.map(q => q.question_text?.toLowerCase().trim()));
      const newQuestions = data.questions.filter(q => 
        !existingTexts.has(q.question_text?.toLowerCase().trim())
      );

      if (newQuestions.length === 0) {
        setStatus({ type: 'error', message: 'All questions already exist in the database.' });
        setImporting(false);
        return;
      }

      // Remove id, created_date, updated_date, created_by from imported questions
      const cleanedQuestions = newQuestions.map(q => {
        const { id, created_date, updated_date, created_by, ...rest } = q;
        return rest;
      });

      await base44.entities.Question.bulkCreate(cleanedQuestions);

      setStatus({ 
        type: 'success', 
        message: `Successfully imported ${cleanedQuestions.length} questions!` +
                 (data.questions.length > cleanedQuestions.length ? 
                  ` (${data.questions.length - cleanedQuestions.length} duplicates skipped)` : '')
      });
      
      onImportComplete?.();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to import questions. Please check the file format.' 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-0 shadow-lg rounded-2xl">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Backup & Restore
          </h3>
          <p className="text-slate-500 text-sm">
            Export all questions to JSON or import from a backup file
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            disabled={exporting || questions.length === 0}
            className="flex-1 bg-[#0A1628] hover:bg-[#1a2942] text-white"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export All ({questions.length})
              </>
            )}
          </Button>

          <label className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
            <Button
              asChild
              disabled={importing}
              className="w-full bg-[#C5A572] hover:bg-[#b39562] text-white"
            >
              <span>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import from File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {status && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
            status.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-slate-50 text-slate-800'
          }`}>
            {status.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            {status.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            {status.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            <p>{status.message}</p>
          </div>
        )}
      </div>
    </Card>
  );
}