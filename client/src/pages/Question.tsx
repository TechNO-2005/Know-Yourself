import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Question {
  id: number;
  theme: string;
  icon: string;
  color: string;
  prompt: string;
  guide: string;
}

interface Reflection {
  questionId: number;
  userResponse: string | null;
}

export default function Question() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const questionId = parseInt(id!);
  
  const [response, setResponse] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: question } = useQuery<Question>({
    queryKey: [`/api/questions/${questionId}`],
  });

  const { data: reflection } = useQuery<Reflection>({
    queryKey: [`/api/reflections/${questionId}`],
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  // Auto-save mutation
  const saveReflection = useMutation({
    mutationFn: async (data: { questionId: number; questionText: string; userResponse: string }) => {
      await apiRequest("POST", "/api/reflections", data);
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
    onError: (error) => {
      toast({
        title: "Save Error",
        description: "Failed to save your reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize response from existing reflection
  useEffect(() => {
    if (reflection?.userResponse) {
      setResponse(reflection.userResponse);
    }
  }, [reflection]);

  // Auto-save logic
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (response.trim() && question) {
      const timeout = setTimeout(() => {
        saveReflection.mutate({
          questionId: question.id,
          questionText: question.prompt,
          userResponse: response,
        });
      }, 1000); // Save after 1 second of inactivity

      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [response, question]);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      orange: { bg: "bg-orange-100", text: "text-orange-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
      teal: { bg: "bg-teal-100", text: "text-teal-600" },
      red: { bg: "bg-red-100", text: "text-red-600" },
      indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
      violet: { bg: "bg-violet-100", text: "text-violet-600" },
      cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
      pink: { bg: "bg-pink-100", text: "text-pink-600" },
    };
    return colorMap[color] || colorMap.blue;
  };

  const handlePrevious = () => {
    if (questionId > 1) {
      setLocation(`/question/${questionId - 1}`);
    }
  };

  const handleNext = () => {
    if (questionId < questions.length) {
      setLocation(`/question/${questionId + 1}`);
    } else {
      setLocation("/");
    }
  };

  const handleTriggerAnalysis = () => {
    setLocation("/analysis");
  };

  if (!question) {
    return <div>Loading...</div>;
  }

  const colors = getColorClasses(question.color);
  const progress = (questionId / questions.length) * 100;
  const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Breadcrumbs */}
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
                <BreadcrumbPage>Question {questionId} of {questions.length}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{question.theme}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm text-slate-500">Question {questionId} of {questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <i className={`fas fa-${question.icon} ${colors.text} text-xl`}></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{question.theme}</h2>
                  <p className="text-slate-600">Question {questionId} of {questions.length}</p>
                </div>
              </div>
            </div>

            {/* Core Prompt */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Core Prompt</h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                {question.prompt}
              </p>
            </div>

            {/* Reflection Guide */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">
                <i className="fas fa-lightbulb mr-2"></i>
                Reflection Guide
              </h4>
              <p className="text-blue-800 leading-relaxed">
                {question.guide}
              </p>
            </div>

            {/* Text Input Area */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-slate-900 mb-4">Your Reflection</label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full h-64 px-6 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-base leading-relaxed"
                placeholder="Take your time to reflect deeply. Your thoughts are automatically saved as you type..."
              />
              
              {/* Auto-save indicator */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-sm text-slate-500">
                  {saveReflection.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
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

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={questionId === 1}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  Save & Next
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
              <Button 
                onClick={handleTriggerAnalysis}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <i className="fas fa-brain mr-2"></i>
                Trigger AI Analysis Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
