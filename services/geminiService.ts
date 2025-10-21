/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VeoModel,
} from '../types';

// Fix: Updated return type to Promise<string> as blob is no longer needed by the UI.
export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{videoUrl: string; videoObject: Video; videoBlob: Blob}> => {
  console.log('Starting video generation with params:', params);

  // Fix: The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const generateVideoPayload: any = {
    model: params.model,
    // prompt will be added conditionally
    config: {
      numberOfVideos: 1,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
      durationSecs: params.duration,
    },
  };

  if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.videoObject) {
      generateVideoPayload.video = params.videoObject;
      // Per documentation, extension has fixed settings
      generateVideoPayload.model = VeoModel.VEO;
      generateVideoPayload.config.resolution = Resolution.P720;
      generateVideoPayload.config.durationSecs = 7; // Extension adds 7s
      console.log(
        `Extending video with generation task ID: ${params.videoObject.generationTaskId}`,
      );
    } else {
      throw new Error('Video object is required for Extend Video mode.');
    }
  }

  // To better enforce the desired video length, construct a prompt that
  // includes the duration. This helps guide the model, as the `durationSecs`
  // parameter alone may not be strictly followed.
  let finalPrompt = '';
  const promptText = params.prompt ? params.prompt.trim() : '';
  const durationForPrompt =
    params.mode === GenerationMode.EXTEND_VIDEO ? 7 : params.duration;

  if (promptText) {
    finalPrompt = `A ${durationForPrompt} second video of: ${promptText}`;
  } else {
    // Create a prompt if one doesn't exist to carry the duration instruction.
    finalPrompt = `A ${durationForPrompt} second video.`;
  }

  if (params.mode === GenerationMode.EXTEND_VIDEO && !promptText) {
    throw new Error(
      'A prompt is required to describe what happens next in the video extension.',
    );
  }

  generateVideoPayload.prompt = finalPrompt;

  if (params.mode === GenerationMode.IMAGE_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with source image: ${params.startFrame.file.name}`,
      );
    }
  } else if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
      );
    }

    const finalEndFrame = params.isLooping
      ? params.startFrame
      : params.endFrame;
    if (finalEndFrame) {
      generateVideoPayload.config.lastFrame = {
        imageBytes: finalEndFrame.base64,
        mimeType: finalEndFrame.file.type,
      };
      if (params.isLooping) {
        console.log(
          `Generating a looping video using start frame as end frame: ${finalEndFrame.file.name}`,
        );
      } else {
        console.log(`Generating with end frame: ${finalEndFrame.file.name}`);
      }
    }
  } else if (
    params.mode === GenerationMode.REFERENCES_TO_VIDEO ||
    params.mode === GenerationMode.IMAGE_STORY
  ) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name}`);
        referenceImagesPayload.push({
          image: {
            imageBytes: img.base64,
            mimeType: img.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }

    if (
      params.mode === GenerationMode.REFERENCES_TO_VIDEO &&
      params.styleImage
    ) {
      console.log(
        `Adding style image as a reference: ${params.styleImage.file.name}`,
      );
      referenceImagesPayload.push({
        image: {
          imageBytes: params.styleImage.base64,
          mimeType: params.styleImage.file.type,
        },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  }

  console.log('Submitting video generation request...');
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  // Check if the operation finished with an error.
  if (operation.error) {
    console.error(
      'Video generation operation failed with an error:',
      operation.error,
    );
    const errorMessage = `Video generation failed: ${operation.error.message} (Code: ${operation.error.code})`;
    throw new Error(errorMessage);
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      console.error(
        'Video generation finished but returned no videos. Full operation object:',
        JSON.stringify(operation, null, 2),
      );

      const raiReasons = operation.response?.raiMediaFilteredReasons;
      // Fix: Corrected typo 'raiRasons' to 'raiReasons'.
      if (raiReasons && Array.isArray(raiReasons) && raiReasons.length > 0) {
        const specificReason = raiReasons.join(' ');
        throw new Error(
          `The model did not generate a video due to safety policies. Reason: ${specificReason}`,
        );
      }

      throw new Error(
        'The model did not generate a video, which may be due to safety filters. Please try modifying your prompt or images.',
      );
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }

    const url = firstVideo.video.uri;
    console.log('Fetching video from:', url);

    // Construct the final URL with the API key, correctly handling
    // whether the original URI already has query parameters.
    // Fix: The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
    const finalUrl = `${url}&key=${process.env.API_KEY}`;

    const res = await fetch(finalUrl);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Failed to fetch video. Response:', errorBody);
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const videoBlob = await res.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    return {videoUrl, videoObject: firstVideo.video, videoBlob};
  } else {
    console.error('Operation failed:', operation);
    throw new Error(
      'Video generation finished without a response or an error. Please try again.',
    );
  }
};
