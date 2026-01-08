import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ClipboardPaste, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function PasteDataImporter({ onImportComplete, existingQuestions }) {
  const [topicName, setTopicName] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  const parsePastedData = (data, topic) => {
    const lines = data.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('No data found. Please paste data from Excel.');
    }

    // Find header row
    let headerIndex = -1;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes('question') || line.includes('q')) && 
          (line.includes('answer') || line.includes('ans')) &&
          (line.includes('option'))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error('Could not find header row. Make sure your data includes "Question", "Answer", and "Option" columns.');
    }

    // Parse headers
    const headerLine = lines[headerIndex];
    const delimiter = headerLine.includes('\t') ? '\t' : ',';
    const headers = headerLine.split(delimiter).map(h => h.toLowerCase().trim());
    
    const headerMap = {};
    const questionCols = [];
    
    headers.forEach((h, i) => {
      if (h.includes('question') || h === 'q') {
        questionCols.push(i);
      }
      if (h.includes('answer') || h === 'ans' || h === 'a') headerMap.answer = i;
      if (h.includes('option1') || h === 'option 1') headerMap.option1 = i;
      if (h.includes('option2') || h === 'option 2') headerMap.option2 = i;
      if (h.includes('option3') || h === 'option 3') headerMap.option3 = i;
      if (h.includes('option4') || h === 'option 4') headerMap.option4 = i;
      if (h.includes('explanation') || h.includes('explain')) headerMap.explanation = i;
    });
    
    // Use the first question column (contains actual question text)
    headerMap.question = questionCols[0];

    // Parse data rows
    const questions = [];
    const existingTexts = new Set(existingQuestions.map(q => q.question_text?.toLowerCase().trim()));
    const skippedQuestions = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const cells = lines[i].split(delimiter);
      const rowNumber = i + 1;
      
      const questionText = (cells[headerMap.question] || '').trim();
      if (!questionText || questionText.length < 5) continue;
      
      if (existingTexts.has(questionText.toLowerCase().trim())) {
        skippedQuestions.push({
          row: rowNumber,
          question: questionText.substring(0, 60) + (questionText.length > 60 ? '...' : ''),
          reason: 'Duplicate question'
        });
        continue;
      }

      const option1 = (cells[headerMap.option1] || '').trim();
      const option2 = (cells[headerMap.option2] || '').trim();
      const option3 = (cells[headerMap.option3] || '').trim();
      const option4 = (cells[headerMap.option4] || '').trim();
      
      // Skip if no options
      if (!option1 && !option2 && !option3 && !option4) continue;

      const answer = (cells[headerMap.answer] || '').toUpperCase().replace(/[^ABCD]/g, '');
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        skippedQuestions.push({
          row: rowNumber,
          question: questionText.substring(0, 60) + (questionText.length > 60 ? '...' : ''),
          reason: `Invalid answer: "${cells[headerMap.answer] || 'empty'}" (must be A, B, C, or D)`
        });
        continue;
      }

      questions.push({
        topic: topic,
        question_text: questionText,
        option_a: option1,
        option_b: option2,
        option_c: option3,
        option_d: option4,
        correct_answer: answer,
        explanation: (cells[headerMap.explanation] || '').trim(),
        is_starred: false
      });

      existingTexts.add(questionText.toLowerCase().trim());
    }

    if (questions.length === 0) {
      const error = new Error(skippedQuestions.length > 0 
        ? `All questions were skipped. See details below.` 
        : 'No valid questions found in the pasted data. Make sure you have: Question text, Options 1-4, and Answer (A/B/C/D).');
      error.skippedQuestions = skippedQuestions;
      throw error;
    }

    return { questions, skippedQuestions };
  };

  const handleImport = async () => {
    if (!topicName.trim()) {
      setImportStatus({ type: 'error', message: 'Please enter a topic name.' });
      return;
    }
    if (!pastedData.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data from Excel.' });
      return;
    }

    setProcessing(true);
    setImportStatus({ type: 'loading', message: 'Processing data...' });

    try {
      const { questions, skippedQuestions } = parsePastedData(pastedData, topicName);
      
      // Bulk create questions
      await base44.entities.Question.bulkCreate(questions);

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${questions.length} questions for topic "${topicName}".`,
        skippedQuestions: skippedQuestions.length > 0 ? skippedQuestions : null
      });

      setTopicName('');
      setPastedData('');
      onImportComplete?.();
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error.message || 'Failed to process data.',
        skippedQuestions: error.skippedQuestions || null
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-8 bg-white border-0 shadow-lg rounded-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardPaste className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Import Questions
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Copy data from Excel and paste it here. Include headers: Question, Answer (A/B/C/D), Option1-4, Explanation (optional).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Topic Name
            </label>
            <Input
              placeholder="e.g., Flight Systems"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste Data from Excel
            </label>
            <Textarea
              placeholder="Paste your Excel data here (copy directly from Excel with Ctrl+C / Cmd+C)"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              disabled={processing}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleImport}
            disabled={processing}
            className="w-full bg-[#0A1628] hover:bg-[#1a2942] text-white"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardPaste className="w-4 h-4 mr-2" />
                Import Questions
              </>
            )}
          </Button>
        </div>

        {importStatus && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
              importStatus.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-slate-50 text-slate-800'
            }`}>
              {importStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {importStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-800" />}
              {importStatus.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
              <p>{importStatus.message}</p>
            </div>
            
            {importStatus.skippedQuestions && importStatus.skippedQuestions.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="font-semibold text-amber-900 text-sm">
                    {importStatus.skippedQuestions.length} question{importStatus.skippedQuestions.length > 1 ? 's' : ''} skipped:
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importStatus.skippedQuestions.map((skip, idx) => (
                    <div key={idx} className="text-xs bg-white rounded p-2 border border-amber-100">
                      <div className="font-medium text-amber-900">Row {skip.row}: {skip.question}</div>
                      <div className="text-amber-700 mt-1">Reason: {skip.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}