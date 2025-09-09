import React, { useState, useEffect, useRef } from "react";
import { useSpeechSynthesis } from "react-speech-kit";

export default function TalkingAvatar({ 
  text, 
  autoSpeak = false, 
  onSpeechStart, 
  onSpeechEnd,
  className = "",
  isVisible = true 
}) {
  const { speak, speaking, cancel, voices } = useSpeechSynthesis();
  const [femaleVoice, setFemaleVoice] = useState(null);
  const videoRef = useRef(null);

  // Pick female voice if available
  useEffect(() => {
    if (voices.length > 0) {
      const female = voices.find(v =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("susan") ||
        v.name.toLowerCase().includes("karen")
      );
      setFemaleVoice(female || voices[0]);
    }
  }, [voices]);

  // Auto-speak when text changes (if enabled)
  useEffect(() => {
    if (autoSpeak && text && text.trim() && femaleVoice && isVisible) {
      startSpeaking();
    }
  }, [text, autoSpeak, femaleVoice, isVisible]);

  // Control video playback based on speaking state
  useEffect(() => {
    if (!videoRef.current) return;

    if (speaking) {
      // Start playing video when speaking
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.log('Video play failed:', err);
      });
    } else {
      // Pause video when not speaking, but keep it visible
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset to beginning for next play
    }
  }, [speaking]);

  const startSpeaking = () => {
    if (!text || !text.trim() || !femaleVoice) return;

    speak({
      text,
      voice: femaleVoice,
      rate: 0.9, // Slightly slower for clarity
      onStart: () => {
        console.log("Avatar speech started");
        if (onSpeechStart) onSpeechStart();
      },
      onEnd: () => {
        console.log("Avatar speech ended");
        if (onSpeechEnd) onSpeechEnd();
      }
    });
  };

  const stopSpeaking = () => {
    cancel();
    console.log("Avatar speech stopped");
    if (onSpeechEnd) onSpeechEnd();
  };

  if (!isVisible) return null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar video - always visible, controlled by speaking state */}
      <video
        ref={videoRef}
        src="/doctor-madam-talking.mp4"
        className="w-full h-auto max-h-60 object-contain rounded-lg"
        muted
        loop
        playsInline
        poster="/doctor-madam-talking-poster.jpg" // Optional: add a poster image
      />

      {/* Speech controls */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={startSpeaking}
          disabled={speaking || !text || !femaleVoice}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center"
          aria-label="Speak"
        >
          {speaking ? (
            <>
              <i className="fa-solid fa-microphone mr-2" aria-hidden="true" />
              Speaking...
            </>
          ) : (
            <>
              <i className="fa-solid fa-volume-up mr-2" aria-hidden="true" />
              Speak
            </>
          )}
        </button>
        <button
          onClick={stopSpeaking}
          disabled={!speaking}
          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center"
          aria-label="Stop speaking"
        >
          <i className="fa-solid fa-stop mr-2" aria-hidden="true" />
          Stop
        </button>
      </div>

      {/* Status indicator */}
      <div className="mt-1 text-xs text-gray-500 text-center">
        {speaking ? (
          <span className="flex items-center justify-center gap-2"> 
            <i className="fa-solid fa-microphone" aria-hidden="true" />
            <span>Speaking...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <i className="fa-solid fa-face-smile" aria-hidden="true" />
            <span>Ready to speak</span>
          </span>
        )}
      </div>
    </div>
  );
}
