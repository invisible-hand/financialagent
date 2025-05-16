"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserContext } from "@/lib/user-context";
import { Loader2, Send, Bot, X, Maximize2, Minimize2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function RoboAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI financial assistant. I can analyze your spending patterns, provide budgeting advice, and help you reach your financial goals. How can I assist with your finances today?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useUserContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage: Message = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Prepare context for the API
      const contextData = {
        userType: "family",
        accountData: userData.accountData,
        transactions: userData.transactions,
      };

      // Call the API
      const response = await fetch("/api/robo-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          contextData,
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error("Empty response received");
      }
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Error in chat:", error);
      
      // Try once more with a simplified request (without transaction data)
      try {
        console.log("Retrying with simplified context...");
        
        const simplifiedContext = {
          userType: "family",
          accountData: userData.accountData,
        };
        
        const retryResponse = await fetch("/api/robo-advisor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            contextData: simplifiedContext,
          })
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.response) {
            setMessages((prev) => [...prev, { role: "assistant", content: retryData.response }]);
            setIsLoading(false);
            return;
          }
        }
        
        // If we get here, both attempts failed
        throw new Error("Retry also failed");
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        // Minimal error message suggesting to try again
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn't process that request. Please try asking again in a different way.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-0 bg-black/20 z-50' : 'bottom-4 right-4 z-50'}`} onClick={isExpanded ? toggleExpand : undefined}>
      {isOpen && (
        <Card 
          className={`
            ${isExpanded ? 'w-4/5 h-4/5 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-100' : 'w-96 md:w-120 h-120'} 
            flex flex-col shadow-lg mb-4 overflow-hidden transition-all duration-300 ease-in-out
          `}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <span className="font-medium">Financial Assistant</span>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpand}
                className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-grow p-4">
            <div className={`flex flex-col space-y-4 ${isExpanded ? 'max-w-4xl mx-auto' : ''}`}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${
                    msg.role === "user"
                      ? "ml-auto bg-blue-50 text-blue-800"
                      : "mr-auto bg-gray-50 text-gray-800"
                  } max-w-[85%] rounded-lg p-3 px-4 shadow-sm fade-in whitespace-pre-wrap`}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-gray-50 text-gray-800 max-w-[85%] rounded-lg p-3 px-4 flex items-center space-x-2 shadow-sm fade-in">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your finances..."
                className="flex-grow"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center"
        >
          <Bot size={28} />
        </Button>
      )}
    </div>
  );
} 