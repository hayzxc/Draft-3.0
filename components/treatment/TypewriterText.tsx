"use client";

import React, { useState, useEffect, useRef } from "react";
import { typewriterAudio } from "@/lib/typewriter-sound";

interface TypewriterTextProps {
  text?: string | null;
  placeholder?: string;
  active?: boolean;
  className?: string;
  bold?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  placeholder = "-",
  active = false,
  className = "",
  bold = true,
}) => {
  const targetText = text ?? "";
  const [displayedText, setDisplayedText] = useState<string>(targetText);
  const [isTypingAnimation, setIsTypingAnimation] = useState<boolean>(false);
  const prevTextRef = useRef<string>(targetText);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prev = prevTextRef.current;
    prevTextRef.current = targetText;

    // Clear any pending animation
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (!targetText) {
      setDisplayedText("");
      setIsTypingAnimation(false);
      return;
    }

    const prevLen = prev.length;
    const nextLen = targetText.length;

    // Case 1: Manual typing (1-2 characters added, or character deleted/replaced)
    if (nextLen === prevLen + 1 || nextLen === prevLen + 2 || nextLen < prevLen) {
      setDisplayedText(targetText);
      setIsTypingAnimation(false);
      if (nextLen > prevLen) {
        typewriterAudio.playKeyClick();
      }
      return;
    }

    // Case 2: Multi-character insertion (e.g. Preset clicked or pasted text)
    // Animate smoothly character-by-character at typewriter speed
    const diff = nextLen - prevLen;
    if (diff > 2) {
      setIsTypingAnimation(true);
      // Start from common prefix or current displayed length
      let currentIndex = Math.min(displayedText.length, nextLen);
      // Calculate speed so it finishes within ~250-400ms regardless of length
      const intervalMs = Math.max(12, Math.min(25, Math.floor(350 / diff)));

      animationTimerRef.current = setInterval(() => {
        currentIndex++;
        if (currentIndex <= nextLen) {
          setDisplayedText(targetText.slice(0, currentIndex));
          typewriterAudio.playKeyClick();
        } else {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current);
            animationTimerRef.current = null;
          }
          setIsTypingAnimation(false);
        }
      }, intervalMs);

      return () => {
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
        }
      };
    }

    // Default sync
    setDisplayedText(targetText);
  }, [targetText]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  const hasContent = displayedText.length > 0;
  const showCursor = active || isTypingAnimation;

  if (!hasContent && !showCursor) {
    return (
      <span className={`text-slate-400 font-normal select-none ${className}`}>
        {placeholder}
      </span>
    );
  }

  // Split last character to apply ink-strike animation if recently typed
  const bodyText = hasContent ? displayedText.slice(0, -1) : "";
  const lastChar = hasContent ? displayedText.slice(-1) : "";

  return (
    <span
      className={`inline whitespace-pre-line ${bold ? "font-bold text-slate-950" : "font-normal text-slate-900"} ${className}`}
    >
      <span>{bodyText}</span>
      {lastChar && <span className="typewriter-char-latest">{lastChar}</span>}
      {showCursor && <span className="typewriter-cursor" aria-hidden="true" />}
    </span>
  );
};

export default TypewriterText;
