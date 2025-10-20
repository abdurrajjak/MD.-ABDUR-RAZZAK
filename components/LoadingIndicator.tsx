/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

const loadingMessages = [
  "Warming up the digital director...",
  "Gathering pixels and photons...",
  "Storyboarding your vision...",
  "Consulting with the AI muse...",
  "Rendering the first scene...",
  "Applying cinematic lighting...",
  "This can take a few minutes, hang tight!",
  "Adding a touch of movie magic...",
  "Composing the final cut...",
  "Polishing the masterpiece...",
  "Teaching the AI to say 'I'll be back'...",
  "Checking for digital dust bunnies...",
  "Calibrating the irony sensors...",
  "Untangling the timelines...",
  "Enhancing to ludicrous speed...",
  "Don't worry, the pixels are friendly.",
  "Harvesting nano banana stems...",
  "Praying to the Gemini star...",
  "Starting a draft for your oscar speech..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-5 border-4 border-purple-500/30 rounded-full"></div>
        <div className="absolute inset-5 border-4 border-b-purple-500 rounded-full animate-spin-reverse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="w-10 h-10 text-pink-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold mt-8 text-gray-200">Generating Your Video</h2>
      <p className="mt-2 text-gray-400 text-center h-6" key={messageIndex}>
        <span className="animate-fade-in-out inline-block">
            {loadingMessages[messageIndex]}
        </span>
      </p>
    </div>
  );
};

export default LoadingIndicator;