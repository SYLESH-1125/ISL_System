# ISL Translator - Indian Sign Language Web Application

A comprehensive web-based Indian Sign Language (ISL) translator that converts English text to ISL using 3D signing avatars with SOV (Subject-Object-Verb) grammar conversion.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- ✅ **Real-time English to ISL Translation** - Convert text/speech to Indian Sign Language
- ✅ **3D Signing Avatars** - Powered by CWASA (Communication With Avatars - Signing Avatars)
- ✅ **SOV Grammar Conversion** - Automatic SVO → SOV transformation for grammatically correct ISL
- ✅ **Speech Recognition** - Voice input support for hands-free operation
- ✅ **Multi-language Support** - Tamil and Hindi word translations
- ✅ **Comprehensive Dataset** - 1,708 validated ISL signs from CISLR, INCLUDE, and ISLTranslate
- ✅ **Interactive Dataset Viewer** - Browse and search available signs
- ✅ **Multiple Avatars** - Choose from 5 different signing avatars (Marc, Anna, Luna, Siggi, Francoise)

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Dataset](#dataset)
- [Avatar Generation](#avatar-generation)
- [Language Processing](#language-processing)
- [SOV Grammar Conversion](#sov-grammar-conversion)
- [Complete Workflow](#complete-workflow)
- [Technical Implementation](#technical-implementation)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Text Input   │  │ Speech Input │  │  Dataset Viewer     │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└────────────┬───────────────┬──────────────────────────────────┘
             │               │
             ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Language Processing Layer                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Multi-language Translation (Tamil/Hindi → English)   │  │
│  │  2. Contraction Expansion (I'm → i am)                   │  │
│  │  3. SOV Grammar Conversion (SVO → SOV)                   │  │
│  │  4. Auxiliary Removal (am, is, are, etc.)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Dataset Mapping Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ISL_DATASET (1,708 entries)                             │  │
│  │  - Direct word mapping                                    │  │
│  │  - Word variations (running → run)                        │  │
│  │  - Compound word detection                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SiGML Generation Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Converts mapped signs to SiGML file references          │  │
│  │  - Single letters: I.sigml (uppercase)                    │  │
│  │  - Words: hello.sigml (lowercase)                         │  │
│  │  - Sequential playback queue                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Avatar Rendering Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CWASA Library (5.5MB)                                    │  │
│  │  - Loads SiGML files from /SignFiles/                     │  │
│  │  - Parses SiGML XML notation                              │  │
│  │  - Renders 3D avatar with WebGL                           │  │
│  │  - Animates signing gestures                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Dataset

### Dataset Sources
The ISL dataset is compiled from three major Indian Sign Language research databases:

1. **CISLR** (Continuous Indian Sign Language Recognition)
   - ~4,700 sign samples
   - Focus: Character actions and continuous signing

2. **INCLUDE** (Indian Sign Language Dataset)
   - ~4,287 sign samples
   - Focus: Daily communication and educational terms

3. **ISLTranslate**
   - ~31,000 sign samples
   - Focus: Comprehensive vocabulary and regional variations

### Dataset Structure

```typescript
export const ISL_DATASET = [
  {
    word: 'accelerate',      // English word
    sign: 'quick',           // Mapped ISL sign
    sovExample: 'I accelerate', // SOV grammar example
    category: 'Transportation' // Semantic category
  },
  // ... 1,708 total entries
]
```

### Dataset Statistics
- **Total Entries**: 1,708 validated sign mappings
- **Available Signs**: 848 unique .sigml files
- **Coverage**: Actions, objects, emotions, questions, numbers, alphabet
- **Languages Supported**: English (primary), Tamil, Hindi (word-level translation)

### Sign Categories
- **Actions**: eat, drink, run, walk, sleep, work, play
- **Objects**: book, pen, table, chair, water, food
- **Emotions**: happy, sad, angry, afraid, love, hate
- **Questions**: what, when, where, why, who, how
- **Numbers**: 0-100, dates, time
- **Alphabet**: A-Z (finger spelling)
- **Common Phrases**: hello, thankyou, sorry, please, welcome

### Word Mapping Strategy

```typescript
// 1. Direct Mapping
'hello' → 'hello.sigml'

// 2. Word Variations (suffix removal)
'running' → 'run' → 'run.sigml'
'walked' → 'walk' → 'walk.sigml'
'tries' → 'try' → 'try.sigml'

// 3. Compound Word Detection
'sleeping' contains 'sleep' → 'sleep.sigml'

// 4. Alphabet Fallback (single letters)
'i' → 'I.sigml' (uppercase for letters)
```

## 🎭 Avatar Generation

### CWASA (Communication With Avatars - Signing Avatars)

The application uses the **CWASA** system, developed by the University of East Anglia, for realistic 3D signing avatar rendering.

#### Technical Components

```
CWASA System Architecture
┌────────────────────────────────────────┐
│  CWASA JavaScript Library (5.5MB)     │
│  - SiGML Parser                        │
│  - Animation Engine                    │
│  - 3D Rendering Pipeline               │
│  - Avatar Configuration                │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  JAS (Java Avatar System)              │
│  - Avatar Models (Marc, Anna, Luna)    │
│  - Skeletal Animation System           │
│  - Hand Shape Library                  │
│  - Facial Expression Engine            │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  SiGML Files (848 files)               │
│  - XML-based sign notation             │
│  - Hand configurations                 │
│  - Movement trajectories               │
│  - Timing information                  │
└────────────────────────────────────────┘
```

### SiGML (Signing Gesture Markup Language)

**SiGML** is an XML-based notation system for encoding sign language gestures.

#### SiGML File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sigml>
  <hns_sign gloss="hello">
    <hamnosys_manual>
      <!-- Hand shape configuration -->
      <hamfinger2345 />
      <hamthumboutmod />
      
      <!-- Hand location -->
      <hamchest />
      <hamlrat />
      
      <!-- Movement -->
      <hammovel />
      <hamarcl />
    </hamnosys_manual>
  </hns_sign>
</sigml>
```

**Key Components:**
- `gloss`: Sign name/meaning
- `hamnosys_manual`: Hand shape and configuration (HamNoSys notation)
- `hamfinger2345`: Finger positions (extended/bent)
- `hamthumboutmod`: Thumb position
- `hamchest/hamlrat`: Hand location relative to body
- `hammovel/hamarcl`: Movement direction and type

### Avatar Models

| Avatar | Gender | Description |
|--------|--------|-------------|
| **Marc** | Male | Default avatar, clear signing style |
| **Anna** | Female | Smooth animations, expressive |
| **Luna** | Female | Natural signing flow |
| **Siggi** | Male | Precise hand shapes |
| **Francoise** | Female | Elegant signing style |

### Rendering Process

```javascript
// 1. Initialize CWASA
window.CWASA.init({
  swaContent: 'CWASAAvatar av0',
  swaLocation: '/jas/',
  playerControl: 'SiGMLURL'
})

// 2. Load SiGML file
const sigmlURL = '/SignFiles/hello.sigml'
await CWASA.playSiGMLURL(sigmlURL)

// 3. Avatar renders sign
// - Parses SiGML XML
// - Configures hand shapes
// - Animates movement
// - Displays in WebGL canvas
```

## 🌐 Language Processing

### Multi-language Translation

The system supports **Tamil** and **Hindi** word translations to English before ISL conversion.

```typescript
const WORD_TRANSLATIONS: Record<string, string> = {
  // Tamil
  'வணக்கம்': 'hello',
  'நன்றி': 'thankyou',
  'வாருங்கள்': 'come',
  
  // Hindi  
  'नमस्ते': 'hello',
  'धन्यवाद': 'thankyou',
  'आओ': 'come',
}
```

### Contraction Expansion

English contractions are expanded for proper grammar processing:

```typescript
const contractions = {
  "i'm": ['i', 'am'],
  "i'll": ['i', 'will'],
  "don't": ['do', 'not'],
  "can't": ['can', 'not'],
  "gonna": ['going', 'to'],
  "wanna": ['want', 'to'],
}
```

**Example:**
```
Input:  "I'm gonna eat"
Expanded: ['i', 'am', 'going', 'to', 'eat']
```

## 🔄 SOV Grammar Conversion

Indian Sign Language follows **SOV (Subject-Object-Verb)** grammar, unlike English **SVO (Subject-Verb-Object)**.

### Conversion Algorithm

```typescript
function convertToSOV(words: string[]): string[] {
  // 1. Expand contractions
  // 2. Remove auxiliaries (am, is, are, will, can, etc.)
  // 3. Identify components:
  //    - Subject (I, you, he, she, we, they)
  //    - Object (book, water, food, etc.)
  //    - Verb (eat, drink, go, etc.)
  //    - Question words (what, where, when, etc.)
  // 4. Reorder: Subject + Object + Verb + Question
}
```

### Examples

| English (SVO) | ISL (SOV) | Transformation |
|---------------|-----------|----------------|
| I eat food | i food eat | Subject + Object + Verb |
| I am going home | i home go | Remove auxiliary "am" |
| What are you doing? | you what do | Move question word to end |
| He is reading book | he book read | Remove auxiliary "is" |
| I will call you | i you call | Remove auxiliary "will" |
| Where do you live? | you where live | Move question, remove "do" |

### Auxiliary Removal

Auxiliary verbs don't have direct ISL equivalents and are removed:

```typescript
const auxiliaries = [
  'am', 'is', 'are', 'was', 'were',  // to be
  'will', 'shall', 'would',          // future/conditional
  'can', 'could', 'should', 'may',   // modals
  'do', 'does', 'did',               // emphasis
  'has', 'have', 'had',              // perfect aspect
  'been', 'being'                    // continuous aspect
]
```

### Question Word Handling

Question words move to the **end** in ISL:

```typescript
// English: "Where are you going?"
// Step 1: Expand → ['where', 'are', 'you', 'going']
// Step 2: Remove auxiliary → ['where', 'you', 'going']
// Step 3: Move question word → ['you', 'going', 'where']
// Result: you going where
```

## 🔄 Complete Workflow

### User Input to Avatar Animation

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: User Input                                               │
├──────────────────────────────────────────────────────────────────┤
│ Text Input: "I am eating food"                                   │
│ Speech Input: Voice → Speech Recognition API → Text              │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Text Normalization                                       │
├──────────────────────────────────────────────────────────────────┤
│ - Convert to lowercase: "i am eating food"                       │
│ - Translate foreign words (if any)                               │
│ - Split into words: ['i', 'am', 'eating', 'food']               │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Contraction Expansion                                    │
├──────────────────────────────────────────────────────────────────┤
│ "i am eating food" → ['i', 'am', 'eating', 'food']              │
│ (No contractions in this example)                                │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: SOV Grammar Conversion                                   │
├──────────────────────────────────────────────────────────────────┤
│ Input:     ['i', 'am', 'eating', 'food']                         │
│ Process:                                                          │
│   - Subject: 'i'                                                  │
│   - Verb: 'eating' → 'eat' (remove -ing)                         │
│   - Object: 'food'                                                │
│   - Auxiliary: 'am' (REMOVED)                                     │
│ Output:    ['i', 'food', 'eat']                                  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Dataset Mapping                                          │
├──────────────────────────────────────────────────────────────────┤
│ For each word, find ISL sign:                                    │
│   'i'    → ISL_DATASET → 'i' (found)                             │
│   'food' → ISL_DATASET → 'food' (found)                          │
│   'eat'  → ISL_DATASET → 'eat' (found)                           │
│                                                                   │
│ Result: ['i', 'food', 'eat'] (all mapped)                        │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: SiGML File Resolution                                    │
├──────────────────────────────────────────────────────────────────┤
│ Convert to SiGML filenames:                                       │
│   'i'    → '/SignFiles/I.sigml' (uppercase for letters)          │
│   'food' → '/SignFiles/food.sigml' (lowercase for words)         │
│   'eat'  → '/SignFiles/eat.sigml'                                │
│                                                                   │
│ Playback Queue: [I.sigml, food.sigml, eat.sigml]                │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 7: Avatar Playback                                          │
├──────────────────────────────────────────────────────────────────┤
│ Sequential playback with timing:                                 │
│                                                                   │
│ Play I.sigml → Avatar signs "I" → Wait for completion            │
│ Play food.sigml → Avatar signs "food" → Wait for completion      │
│ Play eat.sigml → Avatar signs "eat" → Wait for completion        │
│                                                                   │
│ Each sign takes ~1-3 seconds                                      │
│ Total duration: ~3-9 seconds                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Detailed Code Flow

```typescript
// 1. User types text
const userInput = "I am eating food"

// 2. Process text
const processedText = translateText(userInput) // Handle Tamil/Hindi

// 3. Convert to ISL
const { display, signs } = await convertToISL(processedText)
// display: ['i', 'food', 'eat'] (for UI)
// signs: ['i', 'food', 'eat'] (for avatar)

// 4. Set ISL text and trigger playback
setIslText(signs)
playEachWord() // Start sequential playback

// 5. Avatar plays each sign
for (const word of signs) {
  const filename = word.length === 1 
    ? word.toUpperCase()  // Single letter: I.sigml
    : word.toLowerCase()  // Word: food.sigml
  
  const sigmlURL = `/SignFiles/${filename}.sigml`
  await CWASA.playSiGMLURL(sigmlURL)
  // Wait for animation to complete before next sign
}
```

## 💻 Technical Implementation

### Component Architecture

```
components/
├── isl-avatar-player.tsx    # Main ISL translation component
│   ├── Text input handler
│   ├── Speech recognition
│   ├── SOV conversion logic
│   ├── Dataset mapping
│   ├── Avatar playback control
│   └── UI state management
│
├── dataset-viewer.tsx       # Browse ISL dataset
│   ├── Search functionality
│   ├── Category filtering
│   ├── SOV examples
│   └── Sign information
│
└── ui/                      # Reusable UI components
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── select.tsx
    └── ...
```

### Key Functions

#### 1. Text to ISL Conversion

```typescript
async function convertToISL(text: string): Promise<{
  display: string[],
  signs: string[]
}> {
  // Normalize and translate
  const normalizedText = text.toLowerCase()
  const translatedText = translateMultilingual(normalizedText)
  
  // Split into words
  const words = translatedText.split(/\s+/)
  
  // Convert to SOV
  const sovWords = convertToSOV(words)
  
  // Map to ISL signs
  const signs = sovWords
    .map(word => getFallbackSign(word))
    .filter(sign => sign !== null)
  
  return { display: sovWords, signs }
}
```

#### 2. SOV Grammar Conversion

```typescript
function convertToSOV(words: string[]): string[] {
  // Expand contractions
  const expanded = expandContractions(words)
  
  // Remove auxiliaries
  const withoutAux = expanded.filter(w => !auxiliaries.includes(w))
  
  // Identify components
  const subject = findSubject(withoutAux)
  const verb = findVerb(withoutAux)
  const objects = findObjects(withoutAux)
  const question = findQuestionWord(withoutAux)
  
  // Reorder: Subject + Objects + Verb + Question
  return [...subject, ...objects, verb, question].filter(Boolean)
}
```

#### 3. Dataset Mapping

```typescript
function getFallbackSign(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Direct lookup
  if (WORD_TO_SIGN_MAP[lowerWord]) {
    return WORD_TO_SIGN_MAP[lowerWord]
  }
  
  // Word variations (suffix removal)
  const variations = [
    lowerWord.replace(/ing$/, ''),  // running → run
    lowerWord.replace(/ed$/, ''),   // walked → walk
    lowerWord.replace(/s$/, ''),    // walks → walk
    lowerWord.replace(/es$/, ''),   // watches → watch
    lowerWord.replace(/ies$/, 'y'), // tries → try
  ]
  
  for (const variant of variations) {
    if (WORD_TO_SIGN_MAP[variant]) {
      return WORD_TO_SIGN_MAP[variant]
    }
  }
  
  // Compound word detection
  for (const sign of SIGML_WORDS) {
    if (sign.length > 3 && lowerWord.includes(sign)) {
      return sign
    }
  }
  
  // No match found
  return null
}
```

#### 4. Avatar Playback

```typescript
async function playSiGMLAnimation(word: string) {
  // Single letters use uppercase, words use lowercase
  const filename = word.length === 1 
    ? word.toUpperCase() 
    : word.toLowerCase()
  
  const sigmlURL = `/SignFiles/${filename}.sigml`
  
  console.log('[ISL] Playing SiGML:', sigmlURL)
  
  // Use CWASA to play the animation
  setStatusMessage('Playing')
  await cwaRef.current.playSiGMLURL(sigmlURL)
  
  // Update sign info
  setSignInfo({
    sign: word,
    frame: '0',
    gloss: word
  })
}
```

#### 5. Sequential Playback

```typescript
function playEachWord() {
  setIsPlaying(true)
  setPlayerAvailableToPlay(false)
  currentIndexRef.current = 0

  // Play signs one by one
  playIntervalRef.current = setInterval(() => {
    const currentIdx = currentIndexRef.current
    const totalWords = islText.length

    if (currentIdx >= totalWords) {
      // Playback complete
      clearInterval(playIntervalRef.current)
      setIsPlaying(false)
      setPlayerAvailableToPlay(true)
      console.log('[ISL] Playback complete')
    } else if (playerAvailableToPlay) {
      // Play next word
      const currentWord = islText[currentIdx]
      setCurrentWordIndex(currentIdx)
      setPlayerAvailableToPlay(false)
      
      playSiGMLAnimation(currentWord)
      currentIndexRef.current++
    }
  }, 100) // Check every 100ms
}
```

### State Management

```typescript
// Avatar state
const [avatarLoaded, setAvatarLoaded] = useState(false)
const [isLoading, setIsLoading] = useState(true)
const [statusMessage, setStatusMessage] = useState('Initializing...')

// Playback state
const [isPlaying, setIsPlaying] = useState(false)
const [playerAvailableToPlay, setPlayerAvailableToPlay] = useState(true)
const [currentWordIndex, setCurrentWordIndex] = useState(-1)

// Text state
const [inputText, setInputText] = useState('')
const [islText, setIslText] = useState<string[]>([])
const [displayText, setDisplayText] = useState<string[]>([])

// Speech recognition state
const [isListening, setIsListening] = useState(false)
const [recognitionSupported, setRecognitionSupported] = useState(true)

// References
const cwaRef = useRef<any>(null)
const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
const currentIndexRef = useRef<number>(-1)
```

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Setup

```bash
# Clone repository
git clone https://github.com/SYLESH-1125/SYLDEEP.git
cd SYLDEEP

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

No environment variables required. All assets are self-contained.

## 📖 Usage

### Basic Translation

1. **Type Text**: Enter English text in the input field
2. **Press Enter** or click **Translate to ISL**
3. **Watch Avatar**: The avatar will sign the translated text

### Voice Input

1. Click the **Microphone** button
2. Speak clearly in English
3. Text will be auto-populated and translated

### Browse Dataset

1. Click **View Dataset** tab
2. Search for specific words
3. Filter by category
4. View SOV examples for each sign

### Change Avatar

1. Use the **Avatar** dropdown
2. Select from Marc, Anna, Luna, Siggi, or Francoise
3. Avatar changes immediately

## 📁 File Structure

```
SYLDEEP/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page with ISL avatar player
│   └── globals.css             # Global styles
│
├── components/
│   ├── isl-avatar-player.tsx   # Main ISL translation component (1055 lines)
│   ├── dataset-viewer.tsx      # Dataset browser component
│   ├── theme-provider.tsx      # Dark/light theme support
│   └── ui/                     # Reusable UI components (shadcn/ui)
│
├── lib/
│   └── utils.ts                # Utility functions (cn, etc.)
│
├── public/
│   ├── SignFiles/              # 848 SiGML files (.sigml)
│   ├── js/
│   │   └── allcsa.js          # CWASA library (5.5MB)
│   ├── css/
│   │   └── cwasa.css          # CWASA styles
│   └── jas/                   # Java Avatar System files
│       └── loc2021/           # Avatar models and resources
│
├── scripts/
│   └── generate-isl-dataset.py # Python script to generate dataset
│
├── isl-dataset.ts              # ISL dataset (1,708 entries)
├── isl-dataset.json            # JSON version of dataset
├── isl-dataset.csv             # CSV version of dataset
│
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── package.json                # Dependencies and scripts
├── pnpm-lock.yaml              # Dependency lock file
│
├── CWASA_SETUP.md             # CWASA installation documentation
├── DATASET_ACTIONS_UPDATE.md  # Dataset update documentation
└── README.md                  # This file
```

## 🛠️ Technologies Used

### Frontend Framework
- **Next.js 16.0.3** - React framework with server-side rendering
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type-safe JavaScript

### UI Components
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Lucide React** - Icon library

### Avatar System
- **CWASA** - Signing avatar engine (5.5MB)
- **JAS** - Java Avatar System
- **SiGML** - Signing Gesture Markup Language
- **WebGL** - 3D rendering

### Speech Recognition
- **Web Speech API** - Browser-native speech recognition
- **SpeechRecognition / webkitSpeechRecognition**

## 🧪 Testing

```bash
# Run linter
pnpm lint

# Check types
pnpm tsc --noEmit

# Build check
pnpm build
```

## 📊 Performance Metrics

- **Initial Load**: 5-10 seconds (CWASA library loading)
- **Sign Playback**: 1-3 seconds per sign
- **Dataset Lookup**: <10ms
- **SOV Conversion**: <50ms
- **Bundle Size**: ~500KB (without CWASA)
- **CWASA Library**: 5.5MB (loaded dynamically)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution
- [ ] Add more ISL signs to dataset
- [ ] Improve SOV grammar algorithm
- [ ] Add regional sign language variations
- [ ] Optimize avatar loading time
- [ ] Add offline support (PWA)
- [ ] Mobile app version (React Native)
- [ ] Add more language translations

## 📝 Dataset Generation

The ISL dataset is generated using the Python script:

```bash
python scripts/generate-isl-dataset.py
```

This script:
1. Combines data from CISLR, INCLUDE, and ISLTranslate
2. Validates sign mappings against available .sigml files
3. Generates TypeScript, JSON, and CSV formats
4. Creates SOV examples for each entry

## 🔧 Configuration

### CWASA Configuration

```javascript
// Avatar initialization
CWASA.init({
  swaContent: 'CWASAAvatar av0',  // Avatar container class
  swaLocation: '/jas/',            // JAS files location
  playerControl: 'SiGMLURL'        // Control method
})
```

### Avatar Selection

```javascript
// Change avatar
CWASA.loadAvatar('anna')  // Options: marc, anna, luna, siggi, francoise
```

### Playback Speed

```javascript
// Adjust signing speed (0.5 = half speed, 2 = double speed)
CWASA.setSpeed(1.0)
```

## 🐛 Known Issues

1. **First Load Delay**: CWASA library (5.5MB) takes 5-10 seconds to load initially
2. **Browser Compatibility**: Requires WebGL support (not available on older browsers)
3. **Speech Recognition**: Only works in Chrome/Edge (Web Speech API limitation)
4. **Single Letter Signs**: Some letters may not have dedicated .sigml files
5. **Regional Variations**: Currently supports standard ISL, not regional dialects

## 🔮 Future Enhancements

- [ ] Offline mode with service workers
- [ ] Save favorite translations
- [ ] Export signed video
- [ ] Multi-sentence translation
- [ ] Custom avatar creation
- [ ] Real-time video signing (camera input)
- [ ] Sign language learning mode
- [ ] ISL to English translation (reverse)
- [ ] Mobile app versions
- [ ] API for third-party integration

## 📚 References

1. **CWASA**: https://vh.cmp.uea.ac.uk/index.php/CWA_Signing_Avatars
2. **SiGML**: http://vh.cmp.uea.ac.uk/index.php/SiGML
3. **HamNoSys**: https://www.sign-lang.uni-hamburg.de/hamnosys/
4. **CISLR Dataset**: Research papers on continuous ISL recognition
5. **INCLUDE Dataset**: Indian sign language educational resources
6. **ISLTranslate**: Large-scale ISL translation corpus

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 👥 Authors

- **SYLESH-1125** - Initial work

## 🙏 Acknowledgments

- University of East Anglia for CWASA avatar system
- CISLR, INCLUDE, and ISLTranslate teams for datasets
- Indian Sign Language Research community
- shadcn for beautiful UI components
- Vercel for hosting and deployment

## 📞 Contact

For questions or support, please open an issue on GitHub or contact:
- GitHub: [@SYLESH-1125](https://github.com/SYLESH-1125)
- Repository: [SYLDEEP](https://github.com/SYLESH-1125/SYLDEEP)

---

**Made with ❤️ for the Indian Deaf Community**
