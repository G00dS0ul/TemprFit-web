'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './VoiceLogger.module.css';

export default function VoiceLogger({ onLogSet }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    let t;
    if (!isListening && transcript && !processing) {
      // Small buffer to allow user to restart or correct before we lock it in
      t = setTimeout(() => {
        processTranscript(transcript);
      }, 800);
    }
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition already started');
      }
    }
  };

  const processTranscript = async (text) => {
    setProcessing(true);
    
    // Improved regex parsing
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|lbs|kilos|pounds)/i);
    const repMatch = text.match(/(\d+)\s*(reps|rep)/i);
    const timeMatch = text.match(/(\d+)\s*(seconds|second|minutes|minute|min|sec)/i);
    const bwMatch = text.match(/(bodyweight|body weight|bw|no weight)/i);
    
    let weight = null;
    let reps = null;

    if (bwMatch) {
      weight = 0; // 0 denotes bodyweight
    } else if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    }

    if (timeMatch) {
      let val = parseInt(timeMatch[1], 10);
      if (timeMatch[2].startsWith('m')) val *= 60; // convert minutes to seconds
      reps = val; // Store time in the reps field for time-based exercises
    } else if (repMatch) {
      reps = parseInt(repMatch[1], 10);
    }
    
    // If the transcript only had numbers, try to infer
    if (weight === null && reps === null) {
      const nums = text.match(/\d+/g);
      if (nums && nums.length === 2) {
        weight = parseFloat(nums[0]);
        reps = parseInt(nums[1], 10);
      } else if (nums && nums.length === 1) {
        reps = parseInt(nums[0], 10);
      }
    }

    if (weight !== null || reps !== null) {
       onLogSet({ weight, reps });
    }

    // Reset after processing
    setTimeout(() => {
      setTranscript('');
      setProcessing(false);
    }, 2000); // Leave it visible a bit longer so user can read what was parsed
  };

  if (!recognitionRef.current) return null; // Not supported

  return (
    <div className={styles.voiceWrapper}>
      <motion.button 
        className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
        transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {processing ? <Loader2 className="spin" size={24} /> : isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </motion.button>
      
      {transcript && (
        <div className={styles.transcriptPopover}>
          {transcript}
        </div>
      )}
    </div>
  );
}
