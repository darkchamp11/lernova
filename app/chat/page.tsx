"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "./components/ChatBox";

export default function ChatPage() {
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Load Ollama URL from localStorage on mount
    const savedUrl = localStorage.getItem("ollama_url");
    if (savedUrl) {
      setOllamaUrl(savedUrl);
      setTempUrl(savedUrl);
    } else {
      // Set default URL
      const defaultUrl = "http://localhost:11434";
      setOllamaUrl(defaultUrl);
      setTempUrl(defaultUrl);
      localStorage.setItem("ollama_url", defaultUrl);
    }
  }, []);

  const handleSaveUrl = () => {
    localStorage.setItem("ollama_url", tempUrl);
    setOllamaUrl(tempUrl);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Back to Dashboard"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Tutor Chat
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your personalized learning assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-3xl">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Ollama Configuration
              </h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="ollama-url"
                    className="block text-sm text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Ollama API Endpoint
                  </label>
                  <input
                    id="ollama-url"
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Make sure Ollama is running and accessible at this URL
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveUrl}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">Quick Setup:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>
                        Install Ollama from{" "}
                        <a
                          href="https://ollama.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900 dark:hover:text-blue-200"
                        >
                          ollama.ai
                        </a>
                      </li>
                      <li>
                        Run <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">ollama pull llama3.2</code> in terminal
                      </li>
                      <li>Ollama will automatically start on localhost:11434</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto">
          <ChatBox ollamaUrl={ollamaUrl} />
        </div>
      </main>
    </div>
  );
}
