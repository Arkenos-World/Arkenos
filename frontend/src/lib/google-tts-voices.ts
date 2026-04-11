/**
 * Gemini TTS voices for gemini-2.5-flash-preview-tts
 * Source: https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * These are the only voices available — Google does not provide an API to list them.
 * 30 multilingual voices, usable with google.beta.GeminiTTS in LiveKit agents.
 */

export interface GeminiVoice {
  id: string;
  gender: "Male" | "Female";
  tone: string;
}

export const GEMINI_TTS_VOICES: GeminiVoice[] = [
  { id: "Zephyr", gender: "Male", tone: "Bright" },
  { id: "Puck", gender: "Male", tone: "Upbeat" },
  { id: "Charon", gender: "Male", tone: "Informative" },
  { id: "Kore", gender: "Female", tone: "Firm" },
  { id: "Fenrir", gender: "Male", tone: "Excitable" },
  { id: "Leda", gender: "Female", tone: "Youthful" },
  { id: "Orus", gender: "Male", tone: "Firm" },
  { id: "Aoede", gender: "Female", tone: "Breezy" },
  { id: "Callirrhoe", gender: "Female", tone: "Easy-going" },
  { id: "Autonoe", gender: "Female", tone: "Bright" },
  { id: "Enceladus", gender: "Male", tone: "Breathy" },
  { id: "Iapetus", gender: "Male", tone: "Clear" },
  { id: "Umbriel", gender: "Male", tone: "Easy-going" },
  { id: "Algieba", gender: "Male", tone: "Smooth" },
  { id: "Despina", gender: "Female", tone: "Smooth" },
  { id: "Erinome", gender: "Female", tone: "Clear" },
  { id: "Algenib", gender: "Female", tone: "Gravelly" },
  { id: "Rasalgethi", gender: "Male", tone: "Informative" },
  { id: "Laomedeia", gender: "Female", tone: "Upbeat" },
  { id: "Achernar", gender: "Female", tone: "Soft" },
  { id: "Alnilam", gender: "Male", tone: "Firm" },
  { id: "Schedar", gender: "Female", tone: "Even" },
  { id: "Gacrux", gender: "Male", tone: "Mature" },
  { id: "Pulcherrima", gender: "Female", tone: "Forward" },
  { id: "Achird", gender: "Male", tone: "Friendly" },
  { id: "Zubenelgenubi", gender: "Male", tone: "Casual" },
  { id: "Vindemiatrix", gender: "Female", tone: "Gentle" },
  { id: "Sadachbia", gender: "Male", tone: "Lively" },
  { id: "Sadaltager", gender: "Male", tone: "Knowledgeable" },
  { id: "Sulafat", gender: "Female", tone: "Warm" },
];
