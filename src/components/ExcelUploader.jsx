import React, { useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';

export default function ExcelUploader({ onUploadComplete, existingQuestions }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  const findHeaderRow = (sheet) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
      const cells = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        cells.push(cell ? String(cell.v).toLowerCase().trim() : '');
      }
      const hasQuestion = cells.some(c => c.includes('question') || c === 'q');
      const hasAnswer = cells.some(c => c.includes('answer') || c === 'ans' || c === 'a');
      if (hasQuestion && hasAnswer) {
        return row;
      }
    }
    return -1;
  };

  const processExcelFile = async (file) => {
    const topicName = file.name.replace(/\.xlsx?$/i, '');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const headerRow = findHeaderRow(sheet);
    if (headerRow === -1) {
      throw new Error(`Could not find header row in ${file.name}`);
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headers = {};
    const headerMap = {};
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = sheet[cellAddress];
      if (cell) {
        const headerText = String(cell.v).toLowerCase().trim();
        headers[headerText] = col;
        
        // Map variations to standard names
        if (headerText.includes('question') || headerText === 'q') headerMap['question'] = col;
        if (headerText.includes('answer') || headerText === 'ans' || headerText === 'a') headerMap['answer'] = col;
        if (headerText.includes('option') && (headerText.includes('1') || headerText.includes('a'))) headerMap['option1'] = col;
        if (headerText.includes('option') && (headerText.includes('2') || headerText.includes('b'))) headerMap['option2'] = col;
        if (headerText.includes('option') && (headerText.includes('3') || headerText.includes('c'))) headerMap['option3'] = col;
        if (headerText.includes('option') && (headerText.includes('4') || headerText.includes('d'))) headerMap['option4'] = col;
        if (headerText.includes('explanation') || headerText.includes('explain')) headerMap['explanation'] = col;
      }
    }

    const questions = [];
    const existingTexts = new Set(existingQuestions.map(q => q.question_text?.toLowerCase().trim()));
    let skippedCount = 0;

    for (let row = headerRow + 1; row <= range.e.r; row++) {
      const getValue = (colName) => {
        const col = headerMap[colName] || headers[colName];
        if (col === undefined) return '';
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        return cell ? String(cell.v).trim() : '';
      };

      const questionText = getValue('question');
      if (!questionText) continue;
      if (existingTexts.has(questionText.toLowerCase().trim())) {
        skippedCount++;
        continue;
      }

      const answer = getValue('answer').toUpperCase().replace(/[^ABCD]/g, '');
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        skippedCount++;
        continue;
      }

      questions.push({
        topic: topicName,
        question_text: questionText,
        option_a: getValue('option1'),
        option_b: getValue('option2'),
        option_c: getValue('option3'),
        option_d: getValue('option4'),
        correct_answer: answer,
        explanation: getValue('explanation') || '',
        is_starred: false
      });

      existingTexts.add(questionText.toLowerCase().trim());
    }

    if (questions.length === 0 && skippedCount > 0) {
      throw new Error(`${skippedCount} questions were skipped (duplicates or invalid answers)`);
    }

    return questions;
  };

  const handleFiles = async (files) => {
    setProcessing(true);
    setUploadStatus({ type: 'loading', message: 'Processing files...' });

    try {
      let allQuestions = [];
      const xlsxFiles = Array.from(files).filter(f => 
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );

      if (xlsxFiles.length === 0) {
        throw new Error('No Excel files found. Please upload .xlsx files.');
      }

      for (const file of xlsxFiles) {
        setUploadStatus({ type: 'loading', message: `Processing ${file.name}...` });
        const questions = await processExcelFile(file);
        allQuestions = [...allQuestions, ...questions];
      }

      if (allQuestions.length === 0) {
        throw new Error('No valid questions found in the uploaded files.');
      }

      // Bulk create questions
      await base44.entities.Question.bulkCreate(allQuestions);

      setUploadStatus({
        type: 'success',
        message: `Successfully imported ${allQuestions.length} questions from ${xlsxFiles.length} file(s).`
      });

      onUploadComplete?.();
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to process files.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [existingQuestions]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Card className="p-8 bg-white border-0 shadow-lg rounded-2xl">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging ? 'border-[#C5A572] bg-amber-50' : 'border-slate-300 hover:border-slate-400'}
        `}
      >
        {processing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#C5A572] animate-spin" />
            <p className="text-slate-600">Processing Excel files...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Upload Question Bank
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Drag and drop Excel files (.xlsx) here, or click to browse.
              Each file name becomes the topic name.
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <Button asChild className="bg-[#0A1628] hover:bg-[#1a2942] text-white">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </span>
              </Button>
            </label>
          </>
        )}
      </div>

      {uploadStatus && (
        <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
          uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
          uploadStatus.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-slate-50 text-slate-800'
        }`}>
          {uploadStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {uploadStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          {uploadStatus.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          <p>{uploadStatus.message}</p>
        </div>
      )}
    </Card>
  );
}