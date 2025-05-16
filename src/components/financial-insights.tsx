"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserContext } from "@/lib/user-context";
import { Loader2, BarChart, X, Maximize2, Minimize2, Timer, Search, Wifi, Utensils } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function FinancialInsights() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useUserContext();
  const responseDivRef = useRef<HTMLDivElement>(null);
  const [preComputedInsights, setPreComputedInsights] = useState<Record<string, string>>({});
  const [isPreComputing, setIsPreComputing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const insightTypes = ["snapshot", "detective", "fastfood", "subscriptions"];

  useEffect(() => {
    if (responseDivRef.current) {
      responseDivRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

  const regenerateAllInsights = async () => {
    console.log("Regenerating all insights...");
    setIsPreComputing(true);
    setErrorMessage(null);
    
    try {
      // Check if userData and transactions are available
      if (!userData.accountData || !userData.transactions) {
        console.warn("User data missing:", {
          hasAccountData: !!userData.accountData,
          hasTransactions: !!userData.transactions,
          isLoading: userData.isLoading
        });
        
        // Show loading message if still loading
        if (userData.isLoading) {
          setErrorMessage("User data is still loading. Please try again in a moment.");
          setIsPreComputing(false);
          return;
        }
        
        console.error("Cannot regenerate insights: User data or transactions missing");
        
        // Try to load transaction data directly from CSV as a fallback
        console.log("Attempting to load transactions directly from CSV...");
        try {
          const response = await fetch(`/1.csv`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
          }
          
          const csvText = await response.text();
          
          if (!csvText || csvText.trim() === '') {
            throw new Error('CSV file is empty');
          }
          
          // Parse the CSV to get transactions
          const lines = csvText.split('\n');
          const headers = lines[0].split(',');
          
          // Find indices for relevant columns
          const dateIndex = headers.findIndex(h => h.includes('Transaction Date'));
          const descIndex = headers.findIndex(h => h.includes('Description'));
          const amountIndex = headers.findIndex(h => h.includes('Amount'));
          const categoryIndex = headers.findIndex(h => h.includes('Category'));
          
          const csvTransactions = [];
          
          // Parse each line of the CSV
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const columns = lines[i].split(',');
            if (columns.length < Math.max(dateIndex, descIndex, amountIndex, categoryIndex) + 1) {
              continue; // Skip malformed lines
            }
            
            csvTransactions.push({
              id: `tx-${i}`,
              date: columns[dateIndex],
              description: columns[descIndex],
              amount: columns[amountIndex],
              currency: "USD",
              category: columns[categoryIndex]
            });
          }
          
          console.log(`Loaded ${csvTransactions.length} transactions from CSV as fallback`);
          
          // Create default account data
          const defaultAccountData = {
            id: "acc-fam-1234",
            name: "Family Joint Account",
            type: "Checking",
            balance: 12580.75,
            currency: "USD"
          };
          
          // Call the batch API to generate all insights with CSV data
          const contextData = {
            accountData: defaultAccountData,
            transactions: csvTransactions,
            userType: "family"
          };
          
          console.log(`Using CSV data with ${csvTransactions.length} transactions`);
          
          // Call the batch endpoint to generate all insights
          const batchResponse = await fetch("/api/financial-insights/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contextData })
          });
          
          if (batchResponse.ok) {
            const data = await batchResponse.json();
            
            if (data.insights) {
              console.log("Successfully regenerated all insights:", data.insights);
              setPreComputedInsights(data.insights);
            } else {
              console.error("Regeneration didn't return valid insights");
              setErrorMessage("Failed to generate insights. Please try again.");
            }
          } else {
            console.error("Failed to regenerate insights:", await batchResponse.text());
            setErrorMessage("Failed to regenerate insights. Please try again.");
          }
          
          return;
        } catch (csvError) {
          console.error("Failed to load transactions from CSV:", csvError);
          setErrorMessage("Missing transaction data. Please try again later.");
          setIsPreComputing(false);
          return;
        }
      }
      
      // Log transaction data to verify it's available
      console.log(`Regenerating with ${userData.transactions.length} transactions and account data:`, 
        userData.accountData);
      
      // Call the batch API to generate all insights
      const contextData = {
        accountData: userData.accountData,
        transactions: userData.transactions,
        userType: "family" // Add explicit user type
      };
      
      // Call the batch endpoint to generate all insights
      const response = await fetch("/api/financial-insights/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextData })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.insights) {
          console.log("Successfully regenerated all insights:", data.insights);
          setPreComputedInsights(data.insights);
          
          // Force a reload to apply the new insights
          window.location.reload();
        } else {
          console.error("Regeneration didn't return valid insights");
          setErrorMessage("Failed to generate insights. Please try again.");
        }
      } else {
        console.error("Failed to regenerate insights:", await response.text());
        setErrorMessage("Failed to connect to the insights service. Please try again later.");
      }
    } catch (error) {
      console.error("Error during insights regeneration:", error);
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsPreComputing(false);
    }
  };

  // Load pre-computed insights from the server when component mounts
  useEffect(() => {
    const loadPreComputedInsights = async () => {
      try {
        console.log(`Loading pre-computed insights...`);
        // Add cache-busting parameter to prevent browser caching
        const response = await fetch(`/api/financial-insights/batch?_=${new Date().getTime()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.insights) {
            console.log(`Loaded pre-computed insights from ${data.source || 'server'}`, data.insights);
            
            // Store insights in state
            setPreComputedInsights(data.insights);
            
            // Check if any insights are missing
            const missingInsights = insightTypes.filter(type => 
              !data.insights[type] || data.insights[type].trim() === ''
            );
            
            if (missingInsights.length > 0) {
              console.log(`Missing insights detected: ${missingInsights.join(', ')}. Requesting regeneration...`);
              // Force regeneration of all insights
              regenerateAllInsights();
            }
          }
        }
      } catch (error) {
        console.error("Error loading pre-computed insights:", error);
      }
    };
    
    loadPreComputedInsights();
  }, [insightTypes, regenerateAllInsights]);

  const toggleInsights = () => {
    if (isOpen) {
      setIsOpen(false);
      // Reset expanded state when closing
      setTimeout(() => {
        setIsExpanded(false);
        setResponse("");
        setErrorMessage(null);
      }, 300); // Wait for close animation to finish
    } else {
      setIsOpen(true);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAnalysisRequest = async (insightType: string) => {
    // Check if we have pre-computed insights for this type
    if (preComputedInsights[insightType]) {
      setResponse("");
      setErrorMessage(null);
      setIsLoading(true);
      setIsExpanded(true);
      
      // Simulate a small delay for UX
      setTimeout(() => {
        setResponse(preComputedInsights[insightType]);
        setIsLoading(false);
      }, 300);
      
      return;
    }
    
    setResponse("");
    setErrorMessage(null);
    setIsLoading(true);
    setIsExpanded(true);
    
    try {
      // Prepare context for the API
      const contextData = {
        accountData: userData.accountData,
        transactions: userData.transactions,
        insightType: insightType,
        format: "markdown"
      };

      // Call API without timeout
      const response = await fetch("/api/financial-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contextData,
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.response);
      
      // Store in pre-computed insights
      setPreComputedInsights(prev => ({
        ...prev,
        [insightType]: data.response
      }));
    } catch (error) {
      console.error("Error getting insights:", error);
      setErrorMessage(
        "Sorry, we couldn't generate insights right now. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-0 bg-black/20 z-50' : 'bottom-4 right-24 z-50'}`} onClick={isExpanded ? toggleExpand : undefined}>
      {isOpen && (
        <Card 
          className={`
            ${isExpanded ? 'w-[90%] h-[85%] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-100' : 'w-96 md:w-120 h-120 mb-4'} 
            flex flex-col shadow-lg overflow-hidden transition-all duration-300 ease-in-out
            ${isLoading && isExpanded ? 'insights-pulse' : ''}
          `}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-emerald-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BarChart size={20} />
              <span className="font-medium">Financial Insights</span>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpand}
                className="h-8 w-8 text-white hover:bg-emerald-700 rounded-full"
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleInsights}
                className="h-8 w-8 text-white hover:bg-emerald-700 rounded-full"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          
          <div className={`p-3 ${isExpanded ? 'flex flex-wrap justify-center gap-2' : 'space-y-2'} ${isExpanded ? '' : 'border-b'}`}>
            <Button
              onClick={() => handleAnalysisRequest("snapshot")}
              className={`${isExpanded ? 'w-auto' : 'w-full'} bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1`}
              disabled={isLoading || isPreComputing}
            >
              <Timer size={16} />
              1-Minute Snapshot
            </Button>
            <Button
              onClick={() => handleAnalysisRequest("detective")}
              className={`${isExpanded ? 'w-auto' : 'w-full'} bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1`}
              disabled={isLoading || isPreComputing}
            >
              <Search size={16} />
              Spending Detective
            </Button>
            <Button
              onClick={() => handleAnalysisRequest("fastfood")}
              className={`${isExpanded ? 'w-auto' : 'w-full'} bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1`}
              disabled={isLoading || isPreComputing}
            >
              <Utensils size={16} />
              Fast Food Spending
            </Button>
            <Button
              onClick={() => handleAnalysisRequest("subscriptions")}
              className={`${isExpanded ? 'w-auto' : 'w-full'} bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1`}
              disabled={isLoading || isPreComputing}
            >
              <Wifi size={16} />
              Subscription Radar
            </Button>
          </div>
          
          <ScrollArea className={`flex-grow p-4 ${isExpanded ? 'overflow-y-auto' : ''}`}>
            {isLoading || isPreComputing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
                <span className="text-sm text-gray-500">
                  {isPreComputing 
                    ? "Pre-computing insights... This may take a minute or two."
                    : "Analyzing your transactions..."}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-center fade-in">
                <div className="text-red-500 mb-2 text-xl">⚠️</div>
                <p className="text-gray-700">{errorMessage}</p>
              </div>
            ) : (
              response && (
                <div className={`text-gray-800 ${isExpanded ? 'max-w-6xl mx-auto p-6' : ''} prose prose-sm md:prose-base lg:prose-lg prose-headings:mb-4 prose-headings:mt-6 prose-h3:text-emerald-700 prose-h2:text-emerald-800 prose-h2:border-b prose-h2:pb-2 prose-h2:border-emerald-100 prose-p:my-4 prose-ul:my-4 prose-li:my-1 prose-table:overflow-x-auto prose-table:my-4 prose-td:p-2 prose-th:p-2 prose-th:bg-emerald-50 prose-strong:text-emerald-700 prose-table:border-collapse prose-td:border prose-th:border prose-td:border-gray-200 prose-th:border-gray-200 prose-table:w-full prose-table:table-auto prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-emerald-50 prose-blockquote:py-1 prose-blockquote:rounded-r fade-in`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Add custom styling for specific markdown elements
                      h2: ({...props}) => <h2 className="text-2xl font-bold text-emerald-800 mt-8 mb-4 pb-2 border-b border-emerald-100" {...props} />,
                      h3: ({...props}) => <h3 className="text-xl font-bold text-emerald-700 mt-6 mb-3" {...props} />,
                      table: ({...props}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props} /></div>,
                      th: ({...props}) => <th className="border border-gray-200 bg-emerald-50 p-2 text-left" {...props} />,
                      td: ({...props}) => <td className="border border-gray-200 p-2" {...props} />,
                      blockquote: ({...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 my-4 bg-emerald-50 rounded-r italic text-gray-700" {...props} />,
                      strong: ({...props}) => <strong className="font-bold text-emerald-700" {...props} />,
                      li: ({...props}) => <li className="my-1" {...props} />,
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              )
            )}
            <div ref={responseDivRef} />
          </ScrollArea>
        </Card>
      )}

      {!isOpen && (
        <Button
          onClick={toggleInsights}
          className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg flex items-center justify-center"
        >
          <BarChart size={28} />
        </Button>
      )}
    </div>
  );
} 