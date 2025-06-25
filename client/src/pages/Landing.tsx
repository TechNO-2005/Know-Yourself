import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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
            <nav className="hidden md:flex space-x-6">
              <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors">About</a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
            </nav>
            <button className="md:hidden text-slate-600">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Reflective abstract pattern background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse-soft"></div>
            <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-violet-100 rounded-full opacity-30 animate-pulse-soft" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-emerald-100 rounded-full opacity-25 animate-pulse-soft" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                Self-Discovery Through Reflection
              </span>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Discover Who You <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Really Are</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                A thoughtful journey through Ivy League-inspired reflection prompts, powered by AI insights to help you understand yourself better.
              </p>
            </div>

            {/* Inspirational Quote */}
            <Card className="mb-12 border border-slate-200">
              <CardContent className="p-8">
                <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 mb-4 italic">
                  "Reflection without action becomes illusion. Learn, then move forward."
                </blockquote>
                <div className="flex items-center justify-center text-slate-500">
                  <div className="w-8 h-px bg-slate-300 mr-3"></div>
                  <span className="text-sm">Your journey starts here</span>
                  <div className="w-8 h-px bg-slate-300 ml-3"></div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleSignIn}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <i className="fas fa-rocket mr-2"></i>
                Start Your Journey
              </Button>
              <Button 
                variant="outline"
                onClick={handleSignIn}
                className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-pen-fancy text-blue-600 text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">Reflect Deeply</h4>
              <p className="text-slate-600">Answer 10 thoughtful questions inspired by Ivy League college prompts, one at a time.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-violet-600 text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">AI Analysis</h4>
              <p className="text-slate-600">Get psychological insights and discoveries about yourself powered by advanced AI.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lightbulb text-emerald-600 text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">Personal Growth</h4>
              <p className="text-slate-600">Capture your learnings and insights for ongoing self-development.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
