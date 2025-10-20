/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Fix: Removed API key management UI and logic. The API key is now handled via environment variables.
import React, {useCallback, useState} from 'react';
import {CurvedArrowDownIcon, ExclamationTriangleIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: React.ReactNode;
    type?: 'error' | 'warning';
  } | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  // A single state to hold the initial values for the prompt form
  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);
  const [clearImagesOnTryAgain, setClearImagesOnTryAgain] = useState(false);

  // Fix: Removed API key check logic.
  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    setAppState(AppState.LOADING);
    setErrorDetails(null);
    setLastConfig(params);
    setClearImagesOnTryAgain(false);
    // Reset initial form values for the next fresh start
    setInitialFormValues(null);

    try {
      // Fix: `generateVideo` now returns a single URL string.
      const url = await generateVideo(params);
      setVideoUrl(url);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMsgString =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      // Check for quota error first
      if (
        typeof errorMsgString === 'string' &&
        (errorMsgString.includes('exceeded your current quota') ||
          errorMsgString.includes('RESOURCE_EXHAUSTED'))
      ) {
        setErrorDetails({
          title: 'Quota Exceeded',
          message: (
            <>
              You've exceeded your current quota. Please check your plan and
              billing details.
              <br />
              For more information, visit the{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/rate-limits"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-400 hover:underline">
                API rate limits documentation
              </a>
              .
            </>
          ),
          type: 'error',
        });
        setAppState(AppState.ERROR);
        return; // Exit after handling specific error
      }

      if (errorMsgString.includes('The model did not generate a video')) {
        const reasonPrefix = 'Reason: ';
        const reasonIndex = errorMsgString.indexOf(reasonPrefix);
        setClearImagesOnTryAgain(true); // Always clear images for safety-related failures.

        if (reasonIndex !== -1) {
          const reason = errorMsgString.substring(
            reasonIndex + reasonPrefix.length,
          );
          setErrorDetails({
            title: 'Content Policy Block',
            message: reason,
            type: 'warning',
          });
        } else {
          setErrorDetails({
            title: 'Video Not Generated',
            message: (
              <>
                <p className="mb-4">{errorMsgString}</p>
                <p className="text-gray-400 text-sm mt-4">
                  Please try modifying your prompt or images.
                </p>
              </>
            ),
            type: 'error',
          });
        }
        setAppState(AppState.ERROR);
        return;
      }

      let userFriendlyMessage = `Video generation failed: ${errorMsgString}`;

      if (typeof errorMsgString === 'string') {
        if (
          errorMsgString.includes('API_KEY_INVALID') ||
          errorMsgString.includes('API key not valid') ||
          errorMsgString.toLowerCase().includes('permission denied') ||
          errorMsgString.includes('Requested entity was not found.')
        ) {
          userFriendlyMessage =
            'Video generation failed due to an API key or permission issue. Please check if the API key is valid and has the required permissions.';
        }
      }

      setErrorDetails({
        title: 'Error',
        message: userFriendlyMessage,
        type: 'error',
      });
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorDetails(null);
    setLastConfig(null);
    setInitialFormValues(null); // Clear the form state
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      if (clearImagesOnTryAgain) {
        // Clear images for the next attempt as per policy violation guidance
        const newConfig = {
          ...lastConfig,
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          inputVideo: null,
        };
        setInitialFormValues(newConfig);
      } else {
        setInitialFormValues(lastConfig);
      }
      setAppState(AppState.IDLE);
      setErrorDetails(null);
    } else {
      // Fallback to a fresh start if there's no last config
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo, clearImagesOnTryAgain]);

  /* const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob) {
      try {
        const base64 = await blobToBase64(lastVideoBlob);
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64};

        setInitialInputVideo(videoFile);
        setInitialMode(GenerationMode.EXTEND_VIDEO);
        setInitialPrompt(
          `Continuing the story from: "${lastConfig.prompt}"\n\n`,
        );

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorDetails(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        setErrorDetails({title: 'Error', message: `Failed to prepare video for extension: ${message}`});
        setAppState(AppState.ERROR);
      }
    }
  }, [lastConfig, lastVideoBlob]); */

  const renderError = (details: {
    title: string;
    message: React.ReactNode;
    type?: 'error' | 'warning';
  }) => {
    const isWarning = details.type === 'warning';
    const theme = {
      container: isWarning
        ? 'bg-yellow-900/20 border-yellow-500'
        : 'bg-red-900/20 border-red-500',
      titleColor: isWarning ? 'text-yellow-300' : 'text-red-400',
      messageColor: isWarning ? 'text-yellow-200' : 'text-red-300',
      iconContainer: isWarning ? 'bg-yellow-500/20' : 'bg-red-500/20',
      iconColor: isWarning ? 'text-yellow-400' : 'text-red-400',
      reasonBox: 'bg-yellow-900/30 border-yellow-600/50',
    };

    return (
      <div
        className={`text-center p-8 rounded-lg max-w-2xl border ${theme.container}`}>
        {isWarning ? (
          <div className="flex flex-col items-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${theme.iconContainer} mb-6`}>
              <ExclamationTriangleIcon
                className={`h-10 w-10 ${theme.iconColor}`}
                aria-hidden="true"
              />
            </div>
            <h2 className={`text-2xl font-bold ${theme.titleColor} mb-4`}>
              {details.title}
            </h2>
            <div
              className={`mt-2 text-center p-4 ${theme.reasonBox} rounded-lg w-full`}>
              <p className={theme.messageColor}>{details.message}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className={`text-2xl font-bold ${theme.titleColor} mb-4`}>
              {details.title}
            </h2>
            <div className={theme.messageColor}>{details.message}</div>
          </>
        )}
        <button
          onClick={handleTryAgainFromError}
          className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen bg-black text-gray-200 font-sans flex justify-center p-4 gap-4 overflow-hidden">
      {/* Left Ad Placeholder */}
      <aside className="hidden lg:flex flex-col items-center justify-center w-40 flex-shrink-0 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-500">
        <span>Google Ad</span>
      </aside>

      {/* Main App Content */}
      <div className="flex-1 flex flex-col max-w-4xl min-w-0 h-full">
        <header className="py-6 flex justify-center items-center px-8 relative z-10 flex-shrink-0">
          <h1 className="text-7xl font-bold tracking-wide text-center animated-main-title">
            free Ai Studio
          </h1>
        </header>
        <main className="w-full flex-grow flex flex-col overflow-y-auto">
          {appState === AppState.IDLE ? (
            <div className="flex-grow flex flex-col items-center justify-center w-full p-4">
              <div className="text-center mb-4">
                <p className="text-2xl text-gray-300 animated-title">
                  Type in the prompt box to start
                </p>
                <CurvedArrowDownIcon className="w-12 h-12 mx-auto mt-2 text-red-600" />
              </div>
              <div className="w-full">
                <PromptForm
                  onGenerate={handleGenerate}
                  initialValues={initialFormValues}
                />
              </div>
              <div className="mt-8 w-full h-24 flex items-center justify-center bg-gray-900/50 border border-gray-700 rounded-lg text-gray-500">
                <span>Google Ad</span>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center w-full">
              {appState === AppState.LOADING && <LoadingIndicator />}
              {appState === AppState.SUCCESS && videoUrl && (
                <VideoResult
                  videoUrl={videoUrl}
                  onRetry={handleRetry}
                  onNewVideo={handleNewVideo}
                  // onExtend={handleExtend}
                />
              )}
              {appState === AppState.SUCCESS &&
                !videoUrl &&
                renderError({
                  title: 'Error',
                  message:
                    'Video generated, but URL is missing. Please try again.',
                  type: 'error',
                })}
              {appState === AppState.ERROR &&
                errorDetails &&
                renderError(errorDetails)}
            </div>
          )}
        </main>
      </div>
      
      {/* Right Ad Placeholder */}
      <aside className="hidden lg:flex flex-col items-center justify-center w-40 flex-shrink-0 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-500">
        <span>Google Ad</span>
      </aside>
    </div>
  );
};

export default App;