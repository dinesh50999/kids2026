import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateStory } from './services/geminiService';
import type { IllustratedStory } from './types';
import CategoryInput from './components/CategoryInput';
import StoryDisplay from './components/StoryDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { BookIcon } from './components/icons';

const API_KEY_STORAGE_KEY = 'gemini-api-key';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  const [category, setCategory] = useState<string>('');
  const [story, setStory] = useState<IllustratedStory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKey(storedKey);
      }
    } catch (e) {
      console.error("Could not access local storage:", e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey.trim()) {
      setError("Please enter a valid API key.");
      return;
    };
    const newKey = tempApiKey.trim();
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
    setTempApiKey('');
    setError(null);
  };

  const clearApiKey = () => {
    setApiKey(null);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  };
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || isLoading || !apiKey) return;

    setIsLoading(true);
    setError(null);
    setStory(null);

    try {
      const result = await generateStory(category, apiKey);
      setStory(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('Requested entity was not found')) {
        setError('Your API key seems invalid. Please enter a valid one.');
        clearApiKey();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, isLoading, apiKey]);

  const handleAnotherStory = () => {
    setStory(null);
    setError(null);
    setCategory('');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    inputRef.current?.focus();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-purple-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <main className="max-w-md w-full mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border border-purple-200">
           <BookIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
           <h1 className="text-3xl font-bold text-purple-800 mb-2">Welcome to Story Time AI!</h1>
           <p className="text-gray-600 mb-6">To create magical stories, please enter your Google AI API key. Your key will be saved in your browser for future visits.</p>
           
           <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <label htmlFor="api-key-input" className="sr-only">Google AI API Key</label>
              <input
                id="api-key-input"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your API Key here"
                className="w-full px-5 py-3 text-gray-700 bg-white border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out"
              >
                Save Key & Start Creating
              </button>
           </form>
           
           {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

            <p className="text-xs text-gray-500 mt-4">
              You can get a key from{' '}
              <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-700">
                Google AI Studio
              </a>.
            </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center items-center gap-4 mb-2">
            <BookIcon className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800 tracking-tight">
              Story Time AI
            </h1>
          </div>
          <p className="text-lg text-purple-700">
            Tell me a category, and I'll write a magical story just for you!
          </p>
        </header>

        <div className="relative text-right mb-4 -mt-4">
          <button onClick={clearApiKey} className="text-xs text-purple-600 hover:underline">Change API Key</button>
        </div>

        <section className="mb-8">
          <CategoryInput 
            ref={inputRef}
            category={category}
            setCategory={setCategory}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        <section aria-live="polite" aria-atomic="true" className="mt-8">
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {story && !isLoading && <StoryDisplay story={story} apiKey={apiKey} />}
          {!isLoading && !error && !story && (
            <div className="text-center p-8 bg-white/60 rounded-2xl border-2 border-dashed border-purple-300">
              <p className="text-xl text-purple-700">Your wonderful story will appear here!</p>
            </div>
          )}
        </section>

        {story && !isLoading && (
          <section className="text-center mt-12">
            <button
              onClick={handleAnotherStory}
              className="bg-green-500 text-white font-bold py-4 px-10 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105"
            >
              Create Another Story
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;