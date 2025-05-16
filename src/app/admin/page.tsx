"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
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
        setResult("Insights successfully pre-generated for all user types.");
      } else {
        setError(data.error || "Failed to pre-generate insights");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pre-generate Global Insights</h2>
        <p className="mb-4 text-gray-700">
          This will pre-generate financial insights for all user types (family and student accounts) using default data.
          Generated insights will be stored in the database and shown to users without requiring real-time generation.
        </p>
        
        <Button 
          onClick={preGenerateInsights} 
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Generating Insights...
            </>
          ) : (
            "Pre-generate All Insights"
          )}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            {result}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
      </Card>
      
      <div className="text-center mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
} 