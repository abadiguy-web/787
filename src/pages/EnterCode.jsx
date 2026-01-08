import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { createPageUrl } from '@/utils';

export default function EnterCode() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '787') {
      sessionStorage.setItem('787_access', 'true');
      window.location.href = createPageUrl('Home');
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] to-[#1a2942] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-[#C5A572]" />
            <h2 className="text-xl font-semibold text-white">Enter Access Code</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="text-center text-2xl tracking-widest bg-white/10 border-white/30 text-white placeholder:text-slate-400"
              autoFocus
            />
            
            {error && (
              <p className="text-red-400 text-sm text-center">Incorrect code. Please try again.</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#C5A572] hover:bg-[#b39562] text-white text-lg py-6"
            >
              Enter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}