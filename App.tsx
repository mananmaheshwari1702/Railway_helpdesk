
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    GoogleGenAI, 
    LiveServerMessage, 
    Modality, 
    Type, 
    FunctionDeclaration,
} from '@google/genai';
import VideoFeed, { VideoFeedHandle } from './components/VideoFeed';
import TrainBoard from './components/TrainBoard';
import VolumeVisualizer, { VolumeVisualizerHandle } from './components/VolumeVisualizer';
import { Train, ConnectionStatus, AUDIO_CONFIG, DashboardMode, PNRStatus, StationFacility, Amenity } from './types';
import { searchTrains, checkPNR, getStationFacilities, findAmenity, getAllAmenities } from './data/trainData';
import { createAudioBlob, decodeAudioData, base64ToArrayBuffer, downsampleTo16k } from './utils/audioUtils';

// Add global augmentation for webkitAudioContext
declare global {
    interface Window {
      webkitAudioContext: typeof AudioContext;
    }
}

// --- Tool Definitions ---
const searchTrainsTool: FunctionDeclaration = {
  name: 'searchTrains',
  description: 'Search for trains using filters. Use "source" for origin city, "destination" for target city, and "trainNumber" for specific train name or number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING, description: 'Origin station or city name (e.g., "Delhi", "Mumbai")' },
      destination: { type: Type.STRING, description: 'Destination station or city name (e.g., "Varanasi", "Bhopal")' },
      trainNumber: { type: Type.STRING, description: 'Train name or 5-digit number (e.g., "12951", "Rajdhani")' }
    }
  }
};

const checkPNRTool: FunctionDeclaration = {
  name: 'checkPNR',
  description: 'Check status of a PNR number. Use this if user asks for PNR status OR shows a ticket to the camera.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      pnr: { type: Type.STRING, description: 'The 10-digit PNR number' }
    },
    required: ['pnr']
  }
};

const getFacilitiesTool: FunctionDeclaration = {
  name: 'getStationFacilities',
  description: 'Get location of station facilities. Use when user asks "Where is the ATM?", "Where is the toilet?".',
  parameters: {
    type: Type.OBJECT,
    properties: {
        query: { type: Type.STRING, description: 'The facility name e.g. "ATM", "Waiting Room", "Toilet"' }
    },
    required: ['query']
  }
};

// --- Language Configuration ---
const LANGUAGES = [
    { id: 'chhattisgarhi', label: 'छत्तीसगढ़ी', sub: 'Chhattisgarhi', voice: 'Kore' },
    { id: 'mixed', label: 'Auto / Mix', sub: 'हिंदी / English / CG / MR', voice: 'Kore' },
    { id: 'english', label: 'English', sub: 'Global', voice: 'Puck' },
    { id: 'hindi', label: 'हिंदी', sub: 'Hindi', voice: 'Kore' },
    { id: 'marathi', label: 'मराठी', sub: 'Marathi', voice: 'Kore' },
];

// --- Sub-components ---

const TranscriptBubble = ({ text, isUser, languageLabel }: { text: string, isUser: boolean, languageLabel?: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    
    // Check if text is long enough to warrant a "Show More" button
    useEffect(() => {
        if (text.length > 150) setIsOverflowing(true);
        else setIsOverflowing(false);
        
        // Auto-collapse on new, short turns
        if (text.length < 50) setIsExpanded(false);
    }, [text]);

    return (
        <div className={`pointer-events-auto ${isUser 
            ? 'self-start bg-black/80 border-l-8 border-yellow-400 rounded-tl-none' 
            : 'self-end bg-blue-900/90 border-r-8 border-blue-400 rounded-tr-none text-right'} 
            text-white backdrop-blur-md px-4 py-3 rounded-xl max-w-[90%] md:max-w-[80%] shadow-xl relative animate-in fade-in slide-in-from-bottom-2 transition-all duration-300 flex flex-col`}>
            
            {isUser && languageLabel && (
                <span className="absolute -top-3 left-2 bg-yellow-500 text-black text-[10px] px-1.5 rounded font-bold uppercase shadow-sm">
                    {languageLabel}
                </span>
            )}

            <p className={`text-xs font-bold mb-1 uppercase tracking-widest ${isUser ? 'text-yellow-400' : 'text-blue-300'}`}>
                {isUser ? 'You' : 'AI Inquiry Center'}
            </p>

            <div 
                ref={contentRef}
                className={`relative transition-all duration-300 ${isExpanded ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-20 overflow-hidden'}`}
            >
                <p className="text-lg font-medium leading-snug whitespace-pre-wrap break-words">
                    {text}
                </p>
                
                {/* Gradient Fade Overlay for collapsed long text */}
                {!isExpanded && isOverflowing && (
                     <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${isUser ? 'from-black/90' : 'from-blue-900/90'} to-transparent`} />
                )}
            </div>

            {isOverflowing && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`mt-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 opacity-80 hover:opacity-100 ${isUser ? 'text-yellow-400 self-start' : 'text-blue-300 self-end'}`}
                >
                    {isExpanded ? 'Show Less' : 'Show More'}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Dashboard State
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(DashboardMode.SCHEDULE);
  const [displayedTrains, setDisplayedTrains] = useState<Train[]>([]);
  const [pnrResult, setPnrResult] = useState<PNRStatus | null>(null);
  const [pnrError, setPnrError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<StationFacility[]>([]);
  const [activeAmenity, setActiveAmenity] = useState<Amenity | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allAmenities] = useState<Amenity[]>(getAllAmenities());

  // Audio & Transcripts State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('chhattisgarhi');
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");

  const videoFeedRef = useRef<VideoFeedHandle>(null);
  const volumeVisualizerRef = useRef<VolumeVisualizerHandle>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const activeSessionRef = useRef<any>(null); // To store the actual session object for closing
  const isConnectedRef = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const lastVolumeUpdateRef = useRef<number>(0);

  // Audio Processing Chain Refs
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const mudFilterRef = useRef<BiquadFilterNode | null>(null); // NEW: Cut "mud" frequencies
  const speechFilterRef = useRef<BiquadFilterNode | null>(null); // Reference for Speech EQ
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Transcript Turn Management
  const isNewUserTurnRef = useRef(true);
  const isNewAiTurnRef = useRef(true);

  // Inactivity Logic
  const lastInteractionTimeRef = useRef<number>(0);
  const INACTIVITY_LIMIT_MS = 60000; // 60 Seconds

  // Reconnection Logic
  const isManualDisconnectRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  
  const apiKey = process.env.API_KEY;

  /**
   * Disconnects the current session.
   * @param manual - If true, prevents auto-reconnection logic.
   * @param keepVideo - If true, keeps the camera stream active (avoids black flicker).
   * @param keepAudio - If true, keeps AudioContexts and Mic Stream active (avoids iOS gesture requirement).
   */
  const disconnect = useCallback(async (manual = true, keepVideo = false, keepAudio = false) => {
    if (manual) {
        isManualDisconnectRef.current = true;
    }
    
    isConnectedRef.current = false;

    // 1. Video Cleanup
    if (!keepVideo) {
        videoFeedRef.current?.stop();
    }
    
    // 2. Audio Processing Cleanup (Nodes)
    // We always disconnect nodes to rebuild the graph with new session callbacks
    if (processorRef.current) { 
        try {
            processorRef.current.disconnect(); 
            processorRef.current.onaudioprocess = null; 
        } catch (e) {}
        processorRef.current = null; 
    }
    if (lowPassFilterRef.current) {
        try { lowPassFilterRef.current.disconnect(); } catch (e) {}
        lowPassFilterRef.current = null;
    }
    if (mudFilterRef.current) {
        try { mudFilterRef.current.disconnect(); } catch (e) {}
        mudFilterRef.current = null;
    }
    if (speechFilterRef.current) {
        try { speechFilterRef.current.disconnect(); } catch (e) {}
        speechFilterRef.current = null;
    }
    if (compressorRef.current) {
        try { compressorRef.current.disconnect(); } catch (e) {}
        compressorRef.current = null;
    }
    if (inputSourceRef.current) { 
        try {
            inputSourceRef.current.disconnect(); 
        } catch (e) {}
        inputSourceRef.current = null; 
    }
    
    // 3. Audio Context & Stream Cleanup
    if (!keepAudio) {
        // Explicitly stop microphone tracks to turn off recording indicator
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        // Explicitly close input context safely
        if (inputAudioContextRef.current) { 
            if(inputAudioContextRef.current.state !== 'closed') {
                await inputAudioContextRef.current.close().catch(e => console.warn("Error closing input ctx", e)); 
            }
            inputAudioContextRef.current = null; 
        }

        // Close output context safely
        if (audioContextRef.current) { 
            if(audioContextRef.current.state !== 'closed') {
                await audioContextRef.current.close().catch(e => console.warn("Error closing output ctx", e)); 
            }
            audioContextRef.current = null; 
        }
    }

    // Stop all output audio irrespective of keepAudio, to silence the bot
    audioQueueRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0; 
    
    // 4. Gemini Session Cleanup
    if (activeSessionRef.current) {
        try {
            activeSessionRef.current.close();
        } catch (e) {
            console.warn("Error closing session", e);
        }
        activeSessionRef.current = null;
    }
    sessionRef.current = null;

    if (volumeVisualizerRef.current) volumeVisualizerRef.current.setVolume(0);
    setIsSpeaking(false);
    
    // Privacy Cleanup (only if full disconnect)
    if (manual && !keepVideo && !keepAudio) {
        setDisplayedTrains([]);
        setPnrResult(null);
        setPnrError(null);
        setFacilities([]);
        setActiveAmenity(null);
        setDashboardMode(DashboardMode.SCHEDULE);
        setHasSearched(false);
        setUserTranscript("");
        setAiTranscript("");
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect(true, false, false);
    };
  }, [disconnect]);

  // Inactivity Monitor
  useEffect(() => {
    const checkInterval = setInterval(() => {
        if (isConnectedRef.current) {
            const idleTime = Date.now() - lastInteractionTimeRef.current;
            if (idleTime > INACTIVITY_LIMIT_MS) {
                console.log("Session timed out due to inactivity");
                disconnect(true, false, false);
                setStatus(ConnectionStatus.DISCONNECTED);
                setErrorMessage("Session ended due to inactivity to protect privacy.");
            }
        }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [disconnect]);

  // Auto-recovery on visibility change (Tab wake up)
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              // If we were supposed to be connected (not manually disconnected) but aren't, try reconnecting
              if (!isManualDisconnectRef.current && !isConnectedRef.current && status !== ConnectionStatus.DISCONNECTED) {
                  console.log("Tab woke up, attempting reconnection...");
                  connectToGemini(true);
              }
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status]); // Dependency on status to check current state

  const getSystemInstruction = (langId: string) => {
    const base = `You are an AI assistant for South East Central Railway (SECR).
            
    **CAPABILITIES**:
    1. **Vision**: You see the passenger. Monitor for people approaching.
    2. **Ticket Scanning**: Read PNR numbers from physical/digital tickets shown to the camera. Use 'checkPNR'.
    3. **Tools**: Use 'searchTrains' for scheduling, 'checkPNR' for status, and 'getStationFacilities' for directions.
    
    **SPEECH RECOGNITION GUIDELINES**:
    - You are in a noisy public kiosk. Listen carefully for station names and 5-digit train numbers.
    - If a user's query is ambiguous (e.g. "train to Bilaspur"), use 'searchTrains' with destination='Bilaspur' to show options.
    
    **CRITICAL UI RULE**:
    - If the user asks about a train, **ALWAYS** call 'searchTrains' with appropriate filters (source, destination, or trainNumber) to update the screen.
    - If the user asks about facilities, **ALWAYS** call 'getStationFacilities' to show the map.
    - This ensures the visual screen always matches your voice response.
    
    **CONVERSATION STYLE**:
    - Keep responses professional like a station announcer but friendly.
    - Do not wait for them to provide all details; help them by offering options.
    `;

    const instructions: Record<string, string> = {
        'english': `
            **LANGUAGE MODE: ENGLISH ONLY**:
            - **PRIMARY INSTRUCTION**: The user is speaking in **English**. Even if the accent is Indian, transcribe and understand it as English.
            - **SCRIPT ENFORCEMENT**: Output all text and understanding in English (Latin Script). **DO NOT** use Indian scripts (Devanagari, Telugu, etc.) for English speech.
            - Speak **only in English**.
            - **PROACTIVE GREETING**: "Hello! Welcome to South East Central Railway Inquiry Center. How can I assist you with your journey today?"
        `,
        'mixed': `
            **MULTILINGUAL CAPABILITIES**:
            - You are fluent in English, Hindi, Chhattisgarhi, and Marathi.
            - Detect the user's language and switch automatically.
            - **PROACTIVE GREETING**: "Namaste! Jai Johar! Namaskar! SECR Smart AI ma aapka swagat hai."
        `,
        'hindi': `
            **LANGUAGE MODE: HINDI**:
            - The user is speaking **Hindi**. 
            - **TRANSCRIPTION RULE**: Transcribe user speech and generate your response text in **Devanagari Script** (Hindi). Do not use Latin script (Hinglish).
            - Speak **primarily in Hindi**.
            - **PROACTIVE GREETING**: "Namaste! SECR Inquiry Center mein aapka swagat hai. Main aapki kya madad kar sakta hoon?"
        `,
        'chhattisgarhi': `
            **LANGUAGE MODE: CHHATTISGARHI**:
            - The user is speaking **Chhattisgarhi**.
            - Expect Devanagari script for transcription context.
            - Speak **primarily in Chhattisgarhi**.
            - Use warm local greetings like "Jai Johar", "Sangwari", "Kaise ho".
            - **PROACTIVE GREETING**: "Jai Johar Sangwari! South East Central Railway ma aapka swagat hai. Kahan jaat ha? Kon si gaadi pakadna hai?"
        `,
        'marathi': `
            **LANGUAGE MODE: MARATHI**:
            - The user is speaking **Marathi**.
            - **TRANSCRIPTION RULE**: Transcribe user speech and generate your response text in **Devanagari Script** (Marathi). Do not use Latin script.
            - Speak **primarily in Marathi**.
            - **PROACTIVE GREETING**: "Namaskar! SECR madhe aaple swagat ahe. Tumhala kuthe jayche ahe?"
        `
    };

    return base + (instructions[langId] || instructions['mixed']);
  };

  const connectToGemini = async (isRetry = false) => {
    if (!apiKey) {
        alert("API Key is missing. Please check your environment variables.");
        setStatus(ConnectionStatus.ERROR);
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Camera/Microphone API not supported in this browser or context (requires HTTPS).");
        setStatus(ConnectionStatus.ERROR);
        return;
    }

    try {
      // 1. Race Condition Fix: If starting a new intent (not a blind retry), 
      // flag the previous session as 'manual disconnect' so it doesn't trigger its own retry logic.
      isManualDisconnectRef.current = true;
      
      // Cleanup previous session. 
      // If retrying or switching language, keep Video AND Audio infrastructure to avoid Mobile Gesture issues.
      const keepResources = isRetry;
      await disconnect(true, true, keepResources); 

      // 2. Setup new state
      if (!isRetry) {
          retryCountRef.current = 0;
          setErrorMessage(null);
      }
      
      // Reset flag for THIS new session
      isManualDisconnectRef.current = false;
      
      // Audio Context Initialization
      // Reuse existing contexts if available (e.g., during Language Switch hot-reload)
      let newOutputCtx = audioContextRef.current;
      let newInputCtx = inputAudioContextRef.current;

      if (!newOutputCtx || newOutputCtx.state === 'closed') {
           const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
           newOutputCtx = new AudioContextClass({ sampleRate: AUDIO_CONFIG.outputSampleRate });
      }
      
      // FIX: Robust Audio Context Creation
      // Do not force sampleRate: 16000 as some hardware/drivers (Windows Bluetooth, some Androids) fail to initialize.
      // We will handle resampling manually if the native rate isn't 16000.
      if (!newInputCtx || newInputCtx.state === 'closed') {
           const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
           newInputCtx = new AudioContextClass(); // Use native sample rate
      }

      // Immediately resume if created in a gesture but suspended
      if (newOutputCtx.state === 'suspended') {
         try { await newOutputCtx.resume(); } catch(e) {}
      }

      // Assign the contexts
      audioContextRef.current = newOutputCtx;
      inputAudioContextRef.current = newInputCtx;

      setStatus(ConnectionStatus.CONNECTING);
      nextStartTimeRef.current = 0;

      // CRITICAL: Enable echo cancellation for Kiosk environments
      // Reuse stream if available, otherwise request new one
      let stream = mediaStreamRef.current;
      
      if (!stream || !stream.active) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                } 
            });
            mediaStreamRef.current = stream;
          } catch (err) {
            setErrorMessage("Microphone access denied. Please check permissions.");
            throw err;
          }
      }

      // RACE CONDITION FIX: User might have clicked 'Disconnect' while permission prompt was open
      if (isManualDisconnectRef.current) {
         console.log("Connection aborted by user during stream acquisition.");
         // Only stop if we just created it; if reusing, disconnect() handles it if needed later
         if (!isRetry) stream.getTracks().forEach(track => track.stop());
         return;
      }

      const inputCtx = inputAudioContextRef.current;
      if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
      }

      // --- IMPROVED AUDIO GRAPH FOR NOISE CANCELLATION ---
      inputSourceRef.current = inputCtx.createMediaStreamSource(stream);
      
      // 1. High-Pass Filter: Aggressive 150Hz cut to remove train engine rumble and heavy wind noise
      const highPass = inputCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 150; 
      lowPassFilterRef.current = highPass;

      // 2. Mud Cut: Cut 500Hz significantly to reduce "hall reverb" / crowd babble boxiness
      const mudCut = inputCtx.createBiquadFilter();
      mudCut.type = 'peaking';
      mudCut.frequency.value = 500;
      mudCut.Q.value = 1.0;
      mudCut.gain.value = -6; // Cut by 6dB to clean up "mud"
      mudFilterRef.current = mudCut;

      // 3. Speech Presence Boost: Peaking filter at 3.5kHz for sharper consonants (s, t, p)
      const speechBoost = inputCtx.createBiquadFilter();
      speechBoost.type = 'peaking';
      speechBoost.frequency.value = 3500; 
      speechBoost.Q.value = 0.8;
      speechBoost.gain.value = 4; // Boost by 4dB
      speechFilterRef.current = speechBoost;

      // 4. Dynamics Compressor: Tuned for high-noise environments
      const compressor = inputCtx.createDynamicsCompressor();
      compressor.threshold.value = -18; // Higher threshold: ignore background noise, trigger on close voice
      compressor.knee.value = 20;       // Harder knee for decisive activation
      compressor.ratio.value = 6;       // Higher compression to balance loud shouting vs normal speaking
      compressor.attack.value = 0.002;  // Fast attack to catch sudden transients
      compressor.release.value = 0.2;   // Faster release to recover gain between words
      compressorRef.current = compressor;

      // Reduced buffer size for lower latency (2048 @ 16k = 128ms)
      processorRef.current = inputCtx.createScriptProcessor(2048, 1, 1);

      // Connect: Source -> HighPass -> MudCut -> SpeechBoost -> Compressor -> Processor -> Dest
      inputSourceRef.current.connect(highPass);
      highPass.connect(mudCut);
      mudCut.connect(speechBoost);
      speechBoost.connect(compressor);
      compressor.connect(processorRef.current);
      processorRef.current.connect(inputCtx.destination);
      // ----------------------------------------------------

      // determine voice based on language
      const currentVoice = LANGUAGES.find(l => l.id === selectedLanguage)?.voice || 'Puck';

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: currentVoice } } },
          systemInstruction: getSystemInstruction(selectedLanguage),
          tools: [{ functionDeclarations: [searchTrainsTool, checkPNRTool, getFacilitiesTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            // FIX: Race condition check. If user clicked disconnect while connecting, abort.
            if (isManualDisconnectRef.current) {
                console.log("Session opened after manual disconnect. Aborting.");
                return;
            }

            console.log("Gemini Connection Opened");
            lastInteractionTimeRef.current = Date.now(); // Reset inactivity timer
            setStatus(ConnectionStatus.CONNECTED);
            isConnectedRef.current = true;
            retryCountRef.current = 0;
            
            // This will now just ensure capture is running if video is already active
            videoFeedRef.current?.start();
            
            if (processorRef.current) {
                processorRef.current.onaudioprocess = (e) => {
                    if (!isConnectedRef.current || !sessionRef.current) return;
                    
                    let inputData = e.inputBuffer.getChannelData(0);
                    
                    const now = Date.now();
                    // PERFORMANCE FIX: Update volume via Ref instead of State
                    if (now - lastVolumeUpdateRef.current > 100) {
                        let sum = 0;
                        for(let i = 0; i < inputData.length; i += 10) sum += inputData[i] * inputData[i];
                        const vol = Math.sqrt(sum / (inputData.length / 10));
                        if (volumeVisualizerRef.current) {
                            volumeVisualizerRef.current.setVolume(vol);
                        }
                        
                        // Inactivity Reset: If volume > 5% (speech detected), reset timer
                        if (vol > 0.05) {
                            lastInteractionTimeRef.current = now;
                        }

                        lastVolumeUpdateRef.current = now;
                    }

                    // FIX: Robust Downsampling
                    // If the audio context is NOT running at 16000Hz (which we didn't force to avoid crashes),
                    // we must downsample the float data before creating the blob.
                    // Otherwise, labelling 48k data as "rate=16000" causes pitch shifting (slow-mo demonic voice).
                    if (inputAudioContextRef.current?.sampleRate && inputAudioContextRef.current.sampleRate !== 16000) {
                        inputData = downsampleTo16k(inputData, inputAudioContextRef.current.sampleRate);
                    }

                    const blob = createAudioBlob(inputData, 16000);
                    
                    sessionPromise.then(session => {
                        if (isConnectedRef.current) {
                            try {
                                session.sendRealtimeInput({ media: blob });
                            } catch (e) {
                                console.warn("Error sending audio input:", e);
                            }
                        }
                    }).catch(() => {});
                };
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             // FIX: Safety check for disconnect state
             if (isManualDisconnectRef.current) return;
             
             // Reset inactivity on any message (interaction active)
             lastInteractionTimeRef.current = Date.now();

             // 0. Handle Transcripts
             if (msg.serverContent?.inputTranscription) {
                 const text = msg.serverContent.inputTranscription.text;
                 if (text) {
                      setUserTranscript(prev => isNewUserTurnRef.current ? text : prev + text);
                      isNewUserTurnRef.current = false;
                 }
             }
             if (msg.serverContent?.outputTranscription) {
                 const text = msg.serverContent.outputTranscription.text;
                 if (text) {
                      setAiTranscript(prev => isNewAiTurnRef.current ? text : prev + text);
                      isNewAiTurnRef.current = false;
                 }
             }
             if (msg.serverContent?.turnComplete) {
                 isNewUserTurnRef.current = true;
                 isNewAiTurnRef.current = true;
             }

             // 1. Handle Interruption
             if (msg.serverContent?.interrupted) {
                 console.log("Interruption detected - Stopping audio");
                 audioQueueRef.current.forEach(source => {
                     try { source.stop(); } catch(e) {}
                 });
                 audioQueueRef.current = [];
                 nextStartTimeRef.current = 0;
                 setIsSpeaking(false);
                 // Reset turn logic so new speech overwrites interrupted speech
                 isNewAiTurnRef.current = true;
                 return;
             }

             // 2. Handle Tool Calls
             if (msg.toolCall) {
                const functionResponses = msg.toolCall.functionCalls.map(fc => {
                    let responseData: any = { error: "Unknown tool" };
                    const args = fc.args as any || {};

                    if (fc.name === 'searchTrains') {
                        // Extract structured parameters: source, destination, trainNumber
                        const { source, destination, trainNumber } = args as any;
                        const results = searchTrains(source, destination, trainNumber);
                        setDisplayedTrains(results);
                        setDashboardMode(DashboardMode.SCHEDULE);
                        setHasSearched(true);
                        responseData = { result: results };
                    } 
                    else if (fc.name === 'checkPNR') {
                        const status = checkPNR(args.pnr || '');
                        if (status) {
                            setPnrResult(status);
                            setPnrError(null);
                        } else {
                            setPnrResult(null);
                            setPnrError("PNR Not Found / Invalid");
                        }
                        setDashboardMode(DashboardMode.PNR);
                        responseData = { result: status ? status : "PNR Not Found" };
                    }
                    else if (fc.name === 'getStationFacilities') {
                        const query = args.query;
                        if (query) {
                            // Search for specific amenity
                            const amenity = findAmenity(query);
                            if (amenity) {
                                setActiveAmenity(amenity);
                                responseData = { location: amenity.answer, amenity: amenity };
                            } else {
                                setActiveAmenity(null);
                                responseData = { error: "Facility not found on map" };
                            }
                        } else {
                            // Default: list all basic ones
                            const facs = getStationFacilities();
                            setFacilities(facs);
                            setActiveAmenity(null);
                            responseData = { facilities: facs };
                        }
                        setDashboardMode(DashboardMode.MAP);
                    }

                    return {
                        id: fc.id,
                        name: fc.name,
                        response: responseData
                    };
                });

                sessionPromise.then(session => {
                    if(isConnectedRef.current) {
                         session.sendToolResponse({ functionResponses: functionResponses });
                    }
                }).catch(err => console.error("Tool Response Error:", err));
             }

             // 3. Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && audioContextRef.current) {
                 setIsSpeaking(true);
                 const ctx = audioContextRef.current;
                 const arrayBuffer = base64ToArrayBuffer(audioData);
                 const buffer = await decodeAudioData(new Uint8Array(arrayBuffer), ctx, AUDIO_CONFIG.outputSampleRate, 1);
                 
                 const source = ctx.createBufferSource();
                 source.buffer = buffer;
                 source.connect(ctx.destination);
                 
                 const currentTime = ctx.currentTime;
                 if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += buffer.duration;
                 
                 source.onended = () => {
                     // Cleanup source from queue
                     const index = audioQueueRef.current.indexOf(source);
                     if (index > -1) {
                         audioQueueRef.current.splice(index, 1);
                     }
                     if (audioQueueRef.current.length === 0) {
                        setIsSpeaking(false);
                     }
                 };
                 audioQueueRef.current.push(source);
             }
          },
          onclose: (e) => {
            console.log("Session closed", e);
            isConnectedRef.current = false;
            setIsSpeaking(false);
            if (volumeVisualizerRef.current) volumeVisualizerRef.current.setVolume(0);
            
            if (!isManualDisconnectRef.current && retryCountRef.current < MAX_RETRIES) {
                retryCountRef.current += 1;
                console.log(`Connection closed. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
                setTimeout(() => connectToGemini(true), 1000);
            } else if (!isManualDisconnectRef.current) {
                setStatus(ConnectionStatus.ERROR);
                if (!errorMessage) setErrorMessage("Connection closed unexpectedly.");
            } else {
                setStatus(ConnectionStatus.DISCONNECTED);
                setErrorMessage(null);
            }
          },
          onerror: (e) => {
            console.error("Session Error", e);
            isConnectedRef.current = false;
            setErrorMessage("An error occurred with the AI session.");
          }
        }
      });
      
      sessionPromise.then(session => {
          activeSessionRef.current = session;
      }).catch(err => {
          console.error("Connection Promise Rejected:", err);
          isConnectedRef.current = false;
          if (retryCountRef.current < MAX_RETRIES) {
             retryCountRef.current += 1;
             setTimeout(() => connectToGemini(true), 1000);
          } else {
             setStatus(ConnectionStatus.ERROR);
             if(!errorMessage) setErrorMessage("Failed to connect to AI Service.");
          }
      });

      sessionRef.current = sessionPromise;

    } catch (error: any) {
      console.error("Connection setup failed:", error);
      setStatus(ConnectionStatus.ERROR);
      setErrorMessage(error.message || "Could not initialize connection.");
      disconnect(true, false, false);
    }
  };
  
  const handleUserDisconnect = useCallback(() => {
      disconnect(true, false, false);
      setStatus(ConnectionStatus.DISCONNECTED);
      setErrorMessage(null);
  }, [disconnect]);

  // FIX: Seamlessly reconnect when language changes to apply new system instructions
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED) {
        console.log("Language changed, hot-reloading session...");
        connectToGemini(true);
    }
  }, [selectedLanguage]);

  // Wrapped in useCallback to act as a stable prop for VideoFeed (React.memo)
  const handleVideoFrame = useCallback((base64Data: string) => {
    if (isConnectedRef.current && sessionRef.current) {
        sessionRef.current.then((session: any) => {
             if (isConnectedRef.current) {
                try {
                    session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } });
                } catch (e) {
                    console.warn("Error sending video input:", e);
                }
             }
        }).catch(() => {});
    }
  }, []); // dependencies are refs, so they are stable

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-900 text-white p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
           <div className="bg-white p-2 rounded-full shadow-md">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-tight">AI based Inquiry Center</h1>
             <p className="text-xs text-blue-200">South East Central Railway Smart AI • <span className="text-yellow-400 font-bold">CG / HI / EN / MR</span></p>
           </div>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className={`px-4 py-1 rounded-full border ${
                status === ConnectionStatus.CONNECTED ? 'bg-green-600 border-green-400' : 
                status === ConnectionStatus.CONNECTING ? 'bg-yellow-600 border-yellow-400 animate-pulse' :
                'bg-red-600 border-red-400'
            } text-sm font-semibold uppercase tracking-wider flex items-center gap-2 shadow-sm`}>
                <div className={`w-2 h-2 rounded-full bg-white ${status === ConnectionStatus.CONNECTED ? 'animate-ping' : ''}`} />
                {status}
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="flex-1 min-h-[300px] relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-black group">
                <VideoFeed 
                    ref={videoFeedRef}
                    isActive={status === ConnectionStatus.CONNECTED}
                    onFrame={handleVideoFrame}
                />
                
                {/* Live Transcripts Overlay (Closed Captions) */}
                {(userTranscript || aiTranscript) && (
                    <div className="absolute bottom-24 left-4 right-4 flex flex-col gap-3 z-20 pointer-events-none">
                        {userTranscript && (
                             <TranscriptBubble 
                                text={userTranscript} 
                                isUser={true} 
                                languageLabel={LANGUAGES.find(l=>l.id===selectedLanguage)?.label || 'USER'} 
                             />
                        )}
                        {aiTranscript && (
                             <TranscriptBubble 
                                text={aiTranscript} 
                                isUser={false} 
                             />
                        )}
                    </div>
                )}
                
                {status === ConnectionStatus.CONNECTED && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center pb-4 space-x-1 transition-opacity duration-300">
                        {isSpeaking ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="w-3 bg-blue-400 rounded-full animate-bounce" style={{ height: '20px', animationDelay: `${i * 0.1}s` }}></div>
                             ))
                        ) : (
                             <VolumeVisualizer ref={volumeVisualizerRef} />
                        )}
                    </div>
                )}
                
                {status === ConnectionStatus.CONNECTED && !isSpeaking && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/50 text-sm font-bold tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        LISTENING...
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-800 rounded-full"></span>
                    System Controls
                </h3>
                
                {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
                    <div className="space-y-4">
                         {/* Error Message Display */}
                         {errorMessage && (
                             <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700 animate-pulse">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                 </svg>
                                 <span>{errorMessage}</span>
                             </div>
                         )}

                         {/* Language Selector */}
                        <div>
                            <p className="text-sm text-gray-500 mb-2 font-semibold uppercase tracking-wider">Select Language / भाषा चुनें</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setSelectedLanguage(lang.id)}
                                        className={`p-2 rounded-lg border-2 text-left transition-all ${
                                            selectedLanguage === lang.id 
                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
                                            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`font-bold ${selectedLanguage === lang.id ? 'text-blue-800' : 'text-gray-700'}`}>
                                            {lang.label}
                                        </div>
                                        <div className="text-xs text-gray-500">{lang.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => connectToGemini(false)}
                            className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 ${
                                status === ConnectionStatus.ERROR 
                                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                : 'bg-blue-700 hover:bg-blue-800 text-white'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {status === ConnectionStatus.ERROR ? "Retry Connection" : "Activate Kiosk"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                         <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase font-bold">Current Mode</p>
                            <p className="text-lg font-bold text-blue-900">
                                {LANGUAGES.find(l => l.id === selectedLanguage)?.label || 'Mixed'}
                            </p>
                         </div>
                        <button 
                            onClick={handleUserDisconnect}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Deactivate System
                        </button>
                    </div>
                )}
                <div className="mt-4 flex gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                        <strong>Demo Tip:</strong> Select 'Chhattisgarhi' to hear the "Jai Johar" greeting immediately upon activation.
                    </p>
                </div>
            </div>
        </div>

        <div className="lg:col-span-7 h-[500px] lg:h-auto">
            <TrainBoard 
                mode={dashboardMode} 
                trains={displayedTrains} 
                pnrData={pnrResult} 
                pnrError={pnrError}
                facilities={facilities} 
                activeAmenity={activeAmenity}
                hasSearched={hasSearched}
                amenities={allAmenities}
            />
        </div>

      </main>
    </div>
  );
};

export default App;
