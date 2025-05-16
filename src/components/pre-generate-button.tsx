"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function PreGenerateButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preGenerateInsights = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/precompute-global-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult("✅ Insights successfully pre-generated! Reloading...");
        
        // Longer delay before reload to ensure everything is saved
        setTimeout(() => {
          // Force reload from server, not from cache
          window.location.href = window.location.href.split('?')[0] + '?refresh=' + new Date().getTime();
        }, 3000);
      } else {
        setError(data.error || "Failed to pre-generate insights");
        // Clear error message after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4">
      <Button 
        onClick={preGenerateInsights} 
        disabled={isGenerating}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          "Pre-generate Insights"
        )}
      </Button>
      
      {result && (
        <span className="ml-3 text-sm text-green-600">{result}</span>
      )}
      
      {error && (
        <span className="ml-3 text-sm text-red-600">{error}</span>
      )}
    </div>
  );
} 