/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  // FilmIcon, // Removed as EXTEND_VIDEO mode is disabled
  FramesModeIcon,
  ImageModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
} from './icons';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.IMAGE_TO_VIDEO]: <ImageModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  // [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-xs block mb-1.5 font-medium ${
        disabled ? 'text-gray-500' : 'text-gray-400'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-600' : 'text-gray-400'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (images: ImageFile[]) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: string;
  tooltip: string;
  multiple?: boolean;
}> = ({onSelect, onRemove, image, label, tooltip, multiple = false}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        // Fix: The type of 'file' was being inferred as 'unknown', causing a type error.
        // Using a for...of loop ensures correct type inference from the FileList.
        const imageFilePromises = [];
        for (const file of files) {
          imageFilePromises.push(fileToImageFile(file));
        }
        const imageFiles = await Promise.all(imageFilePromises);
        onSelect(imageFiles);
      } catch (error) {
        console.error('Error converting file(s):', error);
      }
    }
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const tooltipClasses =
    'absolute text-center bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10';

  if (image) {
    return (
      <div className="relative w-28 h-20 group">
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute top-1 right-1 group/remove">
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image">
            <XMarkIcon className="w-4 h-4" />
          </button>
          <div
            role="tooltip"
            className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover/remove:opacity-100 transition-opacity pointer-events-none z-10">
            Remove image
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-28 h-20 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
        <PlusIcon className="w-6 h-6" />
        <span className="text-xs mt-1">{label}</span>
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          multiple={multiple}
        />
      </button>
      <div role="tooltip" className={tooltipClasses}>
        {tooltip}
      </div>
    </div>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: string;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Fix: Corrected malformed try-catch block for file handling.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="relative w-48 h-28 group">
        <video
          src={URL.createObjectURL(video.file)}
          muted
          loop
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute top-1 right-1 group/remove">
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove video">
            <XMarkIcon className="w-4 h-4" />
          </button>
          <div
            role="tooltip"
            className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover/remove:opacity-100 transition-opacity pointer-events-none z-10">
            Remove video
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-48 h-28 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
        <PlusIcon className="w-6 h-6" />
        <span className="text-xs mt-1">{label}</span>
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
      </button>
      <div
        role="tooltip"
        className="absolute text-center bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        Upload a video to extend.
      </div>
    </div>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const tooltipBaseClasses =
  'absolute w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center';
const tooltipTopCenterClasses = `${tooltipBaseClasses} bottom-full left-1/2 -translate-x-1/2 mb-2`;
const tooltipTopRightClasses = `${tooltipBaseClasses} bottom-full right-0 mb-2`;
const tooltipTopLeftClasses = `${tooltipBaseClasses} bottom-full left-0 mb-2`;
const tooltipRightClasses = `${tooltipBaseClasses} left-full top-1/2 -translate-y-1/2 ml-2 z-20`;

const modeTooltips: Record<GenerationMode, string> = {
  [GenerationMode.TEXT_TO_VIDEO]: 'Generate a video from a text description.',
  [GenerationMode.IMAGE_TO_VIDEO]: 'Animate a single source image.',
  [GenerationMode.FRAMES_TO_VIDEO]:
    'Generate motion between a start and an end frame.',
  [GenerationMode.REFERENCES_TO_VIDEO]:
    'Create a video using reference images for character or environment consistency.',
};

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.PORTRAIT,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);
  const [duration, setDuration] = useState(initialValues?.duration ?? 15);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  const maxDuration = model === VeoModel.VEO ? 30 : 15;

  useEffect(() => {
    // When initialValues prop changes, reset the form state. This is crucial
    // for the "Try Again" functionality where we want to prepopulate the
    // form, and for "New Video" where we want to clear it.
    setPrompt(initialValues?.prompt ?? '');
    setModel(initialValues?.model ?? VeoModel.VEO_FAST);
    setAspectRatio(initialValues?.aspectRatio ?? AspectRatio.PORTRAIT);
    setResolution(initialValues?.resolution ?? Resolution.P720);
    setGenerationMode(initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO);
    setStartFrame(initialValues?.startFrame ?? null);
    setEndFrame(initialValues?.endFrame ?? null);
    setReferenceImages(initialValues?.referenceImages ?? []);
    setStyleImage(initialValues?.styleImage ?? null);
    setInputVideo(initialValues?.inputVideo ?? null);
    setIsLooping(initialValues?.isLooping ?? false);
    setDuration(initialValues?.duration ?? 15);
  }, [initialValues]);

  useEffect(() => {
    // Clamp duration if model changes and current duration is out of bounds
    if (duration > maxDuration) {
      setDuration(maxDuration);
    }
  }, [model, duration, maxDuration]);

  useEffect(() => {
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      setModel(VeoModel.VEO);
      setAspectRatio(AspectRatio.LANDSCAPE);
      setResolution(Resolution.P720);
    }
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        isLooping,
        duration,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      onGenerate,
      isLooping,
      duration,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    // Reset media when mode changes to avoid confusion
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setIsLooping(false);
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe the video you want to create...',
    [GenerationMode.IMAGE_TO_VIDEO]: 'Describe how to animate the image...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe motion between start and end frames...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a video using reference and style images...',
    // [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next in the video...',
  }[generationMode];

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.IMAGE_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <ImageUpload
            label="Source Image"
            image={startFrame}
            onSelect={(images) =>
              images.length > 0 && setStartFrame(images[0])
            }
            onRemove={() => {
              setStartFrame(null);
            }}
            tooltip="Upload the image to be animated."
          />
        </div>
      );
    }
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={(images) =>
                images.length > 0 && setStartFrame(images[0])
              }
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
              tooltip="Upload the first frame of the video."
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={(images) =>
                  images.length > 0 && setEndFrame(images[0])
                }
                onRemove={() => setEndFrame(null)}
                tooltip="Upload the final frame of the video."
              />
            )}
          </div>
          {startFrame && !endFrame && (
            <div className="mt-3 flex items-center relative group">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-sm font-medium text-gray-300 cursor-pointer">
                Create a looping video
              </label>
              <div role="tooltip" className={tooltipTopCenterClasses}>
                When checked, the video will loop seamlessly by using the start
                frame as the end frame.
              </div>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      const handleReferenceSelect = (newImages: ImageFile[]) => {
        setReferenceImages((prevImages) => {
          const spaceLeft = 3 - prevImages.length;
          if (spaceLeft <= 0) {
            return prevImages;
          }
          const imagesToAdd = newImages.slice(0, spaceLeft);
          return [...prevImages, ...imagesToAdd];
        });
      };

      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2 text-center">
              Reference Images ({referenceImages.length}/3)
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-gray-900/50 rounded-lg min-h-[6.5rem]">
              {referenceImages.map((img, index) => (
                <ImageUpload
                  key={index}
                  image={img}
                  label=""
                  onSelect={() => {
                    /* no-op */
                  }}
                  onRemove={() =>
                    setReferenceImages((imgs) =>
                      imgs.filter((_, i) => i !== index),
                    )
                  }
                  tooltip=""
                />
              ))}
              {referenceImages.length < 3 && (
                <ImageUpload
                  label="Add Reference"
                  onSelect={handleReferenceSelect}
                  tooltip="Upload reference images (up to 3). You can select multiple files at once."
                  multiple={true}
                />
              )}
            </div>
          </div>
          <div className="w-full max-w-sm border-t border-gray-700 my-2"></div>
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2 text-center">
              Style Image (optional)
            </h3>
            <ImageUpload
              label="Style Image"
              image={styleImage}
              onSelect={(images) =>
                images.length > 0 && setStyleImage(images[0])
              }
              onRemove={() => setStyleImage(null)}
              tooltip="Upload an image to influence the artistic style of the video."
            />
          </div>
        </div>
      );
    }
    /* if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex items-center justify-center gap-4">
          <VideoUpload
            label="Input Video"
            video={inputVideo}
            onSelect={setInputVideo}
            onRemove={() => setInputVideo(null)}
          />
        </div>
      );
    } */
    return null;
  };

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.IMAGE_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A source image is required.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      const hasNoRefs = referenceImages.length === 0;
      const hasNoPrompt = !prompt.trim();
      isSubmitDisabled = hasNoRefs || hasNoPrompt;
      if (hasNoRefs && hasNoPrompt) {
        tooltipText = 'Please add reference image(s) and enter a prompt.';
      } else if (hasNoRefs) {
        tooltipText = 'At least one reference image is required.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
  }

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <CustomSelect
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value as VeoModel)}
                icon={<SparklesIcon className="w-5 h-5 text-gray-400" />}
                disabled={isRefMode}>
                {Object.values(VeoModel).map((modelValue) => (
                  <option key={modelValue} value={modelValue}>
                    {modelValue}
                  </option>
                ))}
              </CustomSelect>
              <div role="tooltip" className={tooltipTopCenterClasses}>
                Choose the generation model. 'VEO' is higher quality but
                slower.
              </div>
            </div>
            <div className="relative group">
              <CustomSelect
                label="Aspect Ratio"
                value={aspectRatio}
                onChange={(e) =>
                  setAspectRatio(e.target.value as AspectRatio)
                }
                icon={
                  <RectangleStackIcon className="w-5 h-5 text-gray-400" />
                }
                disabled={isRefMode}>
                {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </CustomSelect>
              <div role="tooltip" className={tooltipTopCenterClasses}>
                Select the video's aspect ratio (e.g., Landscape for YouTube,
                Portrait for mobile).
              </div>
            </div>
            <div className="relative group">
              <CustomSelect
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                icon={<TvIcon className="w-5 h-5 text-gray-400" />}
                disabled={isRefMode}>
                <option value={Resolution.P720}>720p</option>
                <option value={Resolution.P1080}>1080p</option>
              </CustomSelect>
              <div role="tooltip" className={tooltipTopCenterClasses}>
                Select the video's resolution. 1080p offers higher quality.
              </div>
            </div>
            <div className="md:col-span-3 pt-2 relative group">
              <label
                htmlFor="duration-slider"
                className="text-xs block mb-1.5 font-medium text-gray-400">
                Duration ({duration}s)
              </label>
              <input
                id="duration-slider"
                type="range"
                min="1"
                max={maxDuration}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
              />
              <p className="text-xs text-gray-500 mt-2">
                Note: The model aims for this duration, but the actual video
                length may vary.
              </p>
              <div role="tooltip" className={tooltipTopCenterClasses}>
                Set the desired length of the video in seconds.
              </div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
          <div className="relative group" ref={modeSelectorRef}>
            <button
              type="button"
              onClick={() => setIsModeSelectorOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              aria-label="Select generation mode">
              {modeIcons[generationMode]}
              <span className="font-medium text-sm whitespace-nowrap">
                {generationMode}
              </span>
            </button>
            <div role="tooltip" className={tooltipTopLeftClasses}>
              Change generation mode
            </div>
            {isModeSelectorOpen && (
              <div className="absolute bottom-full mb-2 w-60 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-10">
                {Object.values(GenerationMode).map((mode) => (
                  <div className="relative group/item w-full" key={mode}>
                    <button
                      type="button"
                      onClick={() => handleSelectMode(mode)}
                      className={`w-full text-left flex items-center gap-3 p-3 hover:bg-indigo-600/50 ${generationMode === mode ? 'bg-indigo-600/30 text-white' : 'text-gray-300'}`}>
                      {modeIcons[mode]}
                      <span>{mode}</span>
                    </button>
                    <div
                      role="tooltip"
                      className={`${tooltipRightClasses} opacity-0 group-hover/item:opacity-100`}>
                      {modeTooltips[mode]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative group flex-grow">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptPlaceholder}
              className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-500 max-h-48 py-2"
              rows={1}
            />
            <div role="tooltip" className={tooltipTopCenterClasses}>
              Enter a description for the video you want to create.
            </div>
          </div>
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`p-2.5 rounded-full hover:bg-gray-700 ${isSettingsOpen ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              aria-label="Toggle settings">
              <SlidersHorizontalIcon className="w-5 h-5" />
            </button>
            <div role="tooltip" className={tooltipTopRightClasses}>
              {isSettingsOpen ? 'Hide' : 'Show'} advanced settings
            </div>
          </div>
          <div className="relative group">
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              aria-label="Generate video"
              disabled={isSubmitDisabled}>
              <ArrowRightIcon className="w-5 h-5 text-white" />
            </button>
            {isSubmitDisabled && tooltipText ? (
              <div
                role="tooltip"
                className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltipText}
              </div>
            ) : (
              <div role="tooltip" className={tooltipTopRightClasses}>
                Generate video
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2 px-4">
          Video generation is a paid-only feature. You will be charged on your
          Cloud project. See{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline">
            pricing details
          </a>
          .
        </p>
      </form>
    </div>
  );
};

export default PromptForm;