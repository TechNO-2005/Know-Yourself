import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FinalLearning {
  id: number;
  userId: string;
  selfWrittenLearnings: string;
  submittedAt: string;
}

export default function FinalLearning() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [learnings, setLearnings] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: finalLearning } = useQuery<FinalLearning>({
    queryKey: ["/api/final-learnings"],
  });

  // Auto-save mutation
  const saveLearnings = useMutation({
    mutationFn: async (data: { selfWrittenLearnings: string }) => {
      await apiRequest("POST", "/api/final-learnings", data);
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/final-learnings"] });
    },
    onError: (error) => {
      toast({
        title: "Save Error",
        description: "Failed to save your learnings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize learnings from existing data
  useEffect(() => {
    if (finalLearning?.selfWrittenLearnings) {
      setLearnings(finalLearning.selfWrittenLearnings);
    }
  }, [finalLearning]);

  // Auto-save logic
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (learnings.trim()) {
      const timeout = setTimeout(() => {
        saveLearnings.mutate({
          selfWrittenLearnings: learnings,
        });
      }, 1000); // Save after 1 second of inactivity

      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [learnings]);

  const handleComplete = () => {
    if (learnings.trim()) {
      saveLearnings.mutate({
        selfWrittenLearnings: learnings,
      });
    }
    
    toast({
      title: "Learning Summary Saved",
      description: "You can access it anytime from your dashboard.",
    });
    
    setLocation("/");
  };

  const wordCount = learnings.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-mirror text-white text-lg"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Know Yourself</h1>
            </div>
            <Link href="/">
              <Button variant="ghost">
                <i className="fas fa-times text-xl"></i>
              </Button>
            </Link>
          </div>
          
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/analysis">AI Analysis</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Personal Insights</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lightbulb text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Personal Insights</h2>
          <p className="text-lg text-slate-600">Now it's time to reflect on what you've learned about yourself</p>
        </div>

        {/* Learning Card */}
        <Card>
          <CardContent className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">What Have You Learned?</h3>
              <div className="bg-emerald-50 rounded-xl p-6 mb-6">
                <p className="text-emerald-800 leading-relaxed">
                  <strong>Your reflection prompt:</strong> Write anything you personally learned about yourself from this experience. 
                  There's no limit. Reflect freely on the insights, patterns, and realizations that emerged during your journey.
                </p>
              </div>
            </div>

            {/* Text Input Area */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-slate-900 mb-4">Your Personal Learning Summary</label>
              <Textarea
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                className="w-full h-80 px-6 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-base leading-relaxed"
                placeholder="Take your time to capture what you've discovered about yourself. This is your personal space to reflect on patterns, insights, and realizations..."
              />
              
              {/* Auto-save indicator */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-sm text-slate-500">
                  {saveLearnings.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-emerald-500 mr-2"></i>
                      <span>Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <i className="fas fa-check-circle text-emerald-500 mr-2"></i>
                      <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  ) : null}
                </div>
                <div className="text-sm text-slate-500">
                  <span>{wordCount} words</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <Button 
                onClick={handleComplete}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
              >
                <i className="fas fa-save mr-2"></i>
                Save Learning Summary
              </Button>
              <p className="text-sm text-slate-500 mt-3">You can always come back and edit this later</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
