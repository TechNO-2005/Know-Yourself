import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

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

interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export default function Home() {
  const { user } = useAuth();
  
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const { data: reflections = [] } = useQuery<Reflection[]>({
    queryKey: ["/api/reflections"],
  });

  const { data: progress } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
  });

  const getReflectionStatus = (questionId: number) => {
    const reflection = reflections.find(r => r.questionId === questionId);
    if (reflection?.userResponse && reflection.userResponse.trim().length > 0) {
      return "completed";
    }
    return "not-started";
  };

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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-mirror text-white text-lg"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Know Yourself</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">
                Welcome back, <span className="font-medium">{user?.firstName || "Friend"}</span>
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Reflection Journey</h2>
          <p className="text-lg text-slate-600">Take your time with each question. Your responses are automatically saved.</p>
        </div>

        {/* Progress Overview */}
        {progress && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Progress Overview</h3>
                <span className="text-sm text-slate-500">{progress.completed} of {progress.total} completed</span>
              </div>
              <Progress value={progress.percentage} className="mb-4" />
              <div className="flex justify-between text-sm text-slate-600">
                <span>Started</span>
                <span>{progress.percentage}% Complete</span>
                <span>{progress.completed > 0 ? "AI Analysis Available" : "Keep Going!"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Categories */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {questions.map((question) => {
            const status = getReflectionStatus(question.id);
            const colors = getColorClasses(question.color);
            
            return (
              <Link key={question.id} href={`/question/${question.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas fa-${question.icon} ${colors.text} text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">{question.theme}</h4>
                        <p className="text-slate-600 text-sm mb-3">{question.prompt.substring(0, 80)}...</p>
                        <div className="flex items-center space-x-2">
                          {status === "completed" ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              <i className="fas fa-check-circle mr-1"></i>
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              <i className="fas fa-circle mr-1"></i>
                              Not Started
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <h4 className="text-xl font-semibold mb-2">AI Analysis Ready</h4>
              <p className="text-violet-100 mb-4">Get psychological insights from your completed reflections</p>
              <Link href="/analysis">
                <Button className="bg-white text-violet-600 hover:bg-violet-50">
                  <i className="fas fa-brain mr-2"></i>
                  Generate Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Continue Journey</h4>
              <p className="text-slate-600 mb-4">Pick up where you left off with your reflections</p>
              <Link href="/question/1">
                <Button>
                  <i className="fas fa-arrow-right mr-2"></i>
                  Continue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
