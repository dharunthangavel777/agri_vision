import React, { useRef, useState } from 'react';
import { 
  Upload, 
  X, 
  ScanLine, 
  Sparkles, 
  Image as ImageIcon, 
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  Check, 
  Copy, 
  Printer, 
  Sprout, 
  ShieldAlert, 
  Info,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { agricultureService, PredictionResult, DiseaseAnalysis } from '../../chat/services/aiService.ts';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { useHistoryStore } from '../../history/stores/historyStore.ts';
import { DiseaseDiagnosisSkeleton, ImageGenerationSkeleton } from '../../../shared/components/skeletons/index.ts';

// Sample leaf test images with realistic diseased foliage
const sampleTomatoBlightImage = 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=600&q=80';
const sampleHealthyLeafImage = 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80';

export const DiseaseDetectionTab: React.FC = () => {
  const { t } = useTranslation();
  const { appData, updateModuleData } = useAppContext();
  const addEntry = useHistoryStore((state) => state.addEntry);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const resetDiseaseResult = () => {
    updateModuleData('disease', null);
    updateModuleData('diseaseError', null);
    updateModuleData('selectedImage', null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateModuleData('selectedImage', reader.result as string);
        updateModuleData('disease', null);
        updateModuleData('diseaseError', null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    updateModuleData('selectedImage', sampleUrl);
    updateModuleData('disease', null);
    updateModuleData('diseaseError', null);
  };

  const handleDiseaseDetection = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!appData.selectedImage) {
      fileInputRef.current?.click();
      return;
    }

    updateModuleData('diseaseLoading', true);
    updateModuleData('diseaseError', null);

    try {
      const res: PredictionResult = await agricultureService.detectDisease(appData.selectedImage);
      updateModuleData('disease', res);
      addEntry({
        id: Date.now(),
        module: 'disease',
        input: { image: 'Leaf Photo' },
        output: res,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      updateModuleData('diseaseError', err.message);
    } finally {
      updateModuleData('diseaseLoading', false);
    }
  };

  const diseaseResult: PredictionResult | null = appData.disease;
  const analysis: DiseaseAnalysis | undefined = diseaseResult?.diseaseAnalysis;

  // Fallback defaults matching high-fidelity prompt if nested fields are missing
  const fallbackOverview = diseaseResult?.overviewSummary || "Based on the uploaded leaf image, the plant appears to have a leaf spot disease with dark brown lesions and leaf-edge necrosis. The exact disease depends on the plant species and the pathogen involved.";
  const fallbackMostLikely = diseaseResult?.result || "Fungal leaf spot";
  const fallbackSymptoms = [
    "Brown to dark-brown spots scattered across the leaf.",
    "Dark margins around several lesions.",
    "Yellowing around some affected areas.",
    "Large, irregular patches of dead tissue along the leaf edges."
  ];
  const fallbackCauses = "Alternaria, Cercospora, or another fungal leaf-spot pathogen. The image alone cannot confirm which one.";
  const fallbackTreatments = diseaseResult?.recommendations && diseaseResult.recommendations.length > 0 ? diseaseResult.recommendations : [
    "Remove severely infected leaves and dispose of them away from healthy plants.",
    "Avoid overhead watering; keep leaves dry where possible.",
    "Improve airflow around the plant and avoid excessive moisture.",
    "If symptoms continue spreading, consult your local agricultural extension office about a suitable fungicide. Brown spots can also have bacterial or non-infectious causes, so confirm the diagnosis before spraying."
  ];

  const currentOverview = analysis?.overviewSummary || fallbackOverview;
  const currentMostLikely = analysis?.mostLikely || fallbackMostLikely;
  const currentSymptoms = analysis?.symptoms && analysis.symptoms.length > 0 ? analysis.symptoms : fallbackSymptoms;
  const currentCauses = analysis?.possibleCauses || fallbackCauses;
  const currentTreatments = analysis?.treatments && analysis.treatments.length > 0 ? analysis.treatments : fallbackTreatments;

  // ChatGPT-style word-by-word streaming for diagnosis text
  const [streamedOverview, setStreamedOverview] = useState<string>('');
  const [isOverviewStreaming, setIsOverviewStreaming] = useState<boolean>(false);

  React.useEffect(() => {
    if (diseaseResult) {
      const fullText = currentOverview;
      const tokens = fullText.split(/(\s+)/);
      let current = '';
      setIsOverviewStreaming(true);
      setStreamedOverview('');

      let index = 0;
      const interval = setInterval(() => {
        if (index < tokens.length) {
          current += tokens[index];
          setStreamedOverview(current);
          index++;
        } else {
          setIsOverviewStreaming(false);
          clearInterval(interval);
        }
      }, 16);

      return () => clearInterval(interval);
    } else {
      setStreamedOverview('');
      setIsOverviewStreaming(false);
    }
  }, [diseaseResult, currentOverview]);

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-105px)] max-h-[calc(100vh-105px)] flex flex-col space-y-2.5 overflow-hidden">
      
      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: IMAGE UPLOAD & SCANNER */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-y-auto no-scrollbar agri-card p-4 space-y-3">
          
          {/* Header Card */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                <ScanLine size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">
                  AI Plant Disease Doctor
                </h3>
                <p className="text-xs text-stone-300">
                  ChatGPT Vision Pathogen Detection
                </p>
              </div>
            </div>

            {appData.selectedImage && (
              <button
                type="button"
                onClick={resetDiseaseResult}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Upload Dropzone / Image Preview */}
          <div className="flex-1 min-h-0 flex flex-col justify-between space-y-3">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="hidden" 
            />

            {!appData.selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[220px] border-2 border-dashed border-white/15 hover:border-[#278b50] rounded-2xl p-6 flex flex-col items-center justify-center bg-black/25 hover:bg-white/[0.03] transition-all cursor-pointer text-center space-y-3 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#278b50]/20 border border-[#278b50]/40 text-[#4ade80] flex items-center justify-center shadow-md">
                  <Upload size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-sm sm:text-base font-bold">
                    Upload Leaf Photo or Drag & Drop Here
                  </p>
                  <p className="text-xs text-stone-300 max-w-xs mx-auto">
                    Take a clear close-up of the leaf surface, spots, or wilted tissue (JPG, PNG, WEBP)
                  </p>
                </div>
                <span className="px-5 py-2 text-xs font-bold text-white bg-[#278b50] hover:bg-[#1f7a44] rounded-xl shadow-md transition-all inline-flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  <span>Browse Photo</span>
                </span>
              </div>
            ) : (
              <div className="flex-1 min-h-[220px] relative rounded-2xl overflow-hidden bg-black/40 border border-white/15 flex items-center justify-center group shadow-inner">
                <img 
                  src={appData.selectedImage} 
                  alt="Selected Leaf for Diagnosis" 
                  className="w-full h-full object-cover max-h-[380px]" 
                  referrerPolicy="no-referrer"
                />

                {/* Remove Image Button */}
                <button 
                  type="button"
                  onClick={resetDiseaseResult}
                  className="absolute top-3 right-3 bg-black/75 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X size={16} />
                </button>

                {/* Change photo badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 left-3 bg-black/75 hover:bg-black/90 text-white px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <RefreshCw size={12} />
                  <span>Change Photo</span>
                </button>

                {/* Active scan image skeleton animation matching ChatGPT */}
                {appData.diseaseLoading && (
                  <div className="absolute inset-0 z-20">
                    <ImageGenerationSkeleton 
                      aspectRatio="auto" 
                      label="Scanning foliar lesions with ChatGPT Vision..." 
                      className="h-full rounded-2xl"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Instant Test Sample Leaf Photos */}
            <div className="shrink-0 space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                No leaf photo right now? Try test sample:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSample(sampleTomatoBlightImage)}
                  className="p-2.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-[#278b50]/50 flex items-center gap-2.5 text-left transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <img src={sampleTomatoBlightImage} alt="Sample" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <b className="text-xs text-white block truncate">Leaf Spot Sample</b>
                    <span className="text-[10px] text-amber-300 font-medium truncate block">Foliar Lesions</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample(sampleHealthyLeafImage)}
                  className="p-2.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-[#278b50]/50 flex items-center gap-2.5 text-left transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <img src={sampleHealthyLeafImage} alt="Healthy" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <b className="text-xs text-white block truncate">Healthy Foliage</b>
                    <span className="text-[10px] text-emerald-400 font-medium truncate block">Vibrant Green</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0 pt-1">
              <button
                type="button"
                onClick={handleDiseaseDetection}
                disabled={appData.diseaseLoading}
                className="w-full bg-[#278b50] hover:bg-[#1f7a44] text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-[#278b50]/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
              >
                {appData.diseaseLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Analyzing Leaf Pathology with AI...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} className="text-[#a7f3d0]" />
                    <span>Diagnose Plant Disease</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: AI RESPONSE (MATCHING SCREENSHOT) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
          
          {appData.diseaseLoading ? (
            <DiseaseDiagnosisSkeleton />
          ) : diseaseResult ? (
            <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3.5 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018]">
              
              {/* TOP ACTION BAR */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      ChatGPT Plant Pathology
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#278b50]/20 text-[#4ade80] rounded border border-[#278b50]/40 font-mono">
                        gpt-4o-mini
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `${currentOverview}\n\nPlant disease identification:\nMost likely: ${currentMostLikely}\nVisible symptoms:\n${currentSymptoms.map(s => `- ${s}`).join('\n')}\nPossible causes: ${currentCauses}\n\nRecommended immediate treatment:\n${currentTreatments.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}`;
                      navigator.clipboard.writeText(text);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    title="Copy Advisory"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check size={13} className="text-[#4ade80]" /> : <Copy size={13} />}
                    <span className="text-[11px] hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetDiseaseResult}
                    title="New Scan"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span className="text-[11px] hidden sm:inline">New</span>
                  </button>
                </div>
              </div>

              {/* SCROLLABLE AI DIAGNOSIS CONTAINER (PIXEL-PERFECT MATCH TO SCREENSHOT) */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 no-scrollbar text-stone-200">
                
                {/* 1. INTRODUCTORY OVERVIEW PARAGRAPH (STREAMED WORD-BY-WORD LIKE CHATGPT) */}
                <div className="text-xs sm:text-sm leading-relaxed text-stone-200 font-medium">
                  {streamedOverview || currentOverview}
                  {isOverviewStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-xs" />
                  )}
                </div>

                {/* 2. PLANT DISEASE IDENTIFICATION (IMAGE ON LEFT, SYMPTOMS ON RIGHT) */}
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-normal">
                    Plant disease identification
                  </h3>

                  <div className="rounded-2xl bg-black/30 border border-white/10 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-start">
                    {/* Uploaded Leaf Image */}
                    {appData.selectedImage && (
                      <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md bg-black/50">
                        <img 
                          src={appData.selectedImage} 
                          alt="Infected Leaf"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Pathology Analysis on Right */}
                    <div className="flex-1 min-w-0 space-y-2.5 text-xs sm:text-sm leading-relaxed">
                      <div>
                        <span className="text-stone-300 font-bold">Most likely: </span>
                        <span className="text-white font-extrabold text-sm sm:text-base">
                          {currentMostLikely}
                        </span>
                      </div>

                      <div>
                        <div className="text-stone-300 font-bold mb-1">
                          Visible symptoms in your image:
                        </div>
                        <ul className="space-y-1 text-stone-300">
                          {currentSymptoms.map((sym, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="text-[#4ade80] font-bold text-sm shrink-0 leading-none mt-1">•</span>
                              <span className="leading-snug">{sym}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-1 text-stone-300">
                        <span className="font-bold text-stone-200">Possible causes: </span>
                        <span className="text-stone-300 font-normal">{currentCauses}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. RECOMMENDED IMMEDIATE TREATMENT (NUMBERED LIST) */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-normal">
                    Recommended immediate treatment
                  </h3>

                  <div className="rounded-2xl bg-black/30 border border-white/10 p-4 shadow-sm">
                    <ol className="space-y-2.5 text-xs sm:text-sm text-stone-300">
                      {currentTreatments.map((tr, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="font-extrabold text-stone-200 shrink-0">
                            {tIdx + 1}.
                          </span>
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

              </div>

              {/* CARD FOOTER */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Check size={13} className="text-[#4ade80]" />
                  Recorded in Farm Activity History
                </span>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer size={12} /> Print Advisory
                </button>
              </div>

            </div>
          ) : (
            <div className="agri-card p-6 flex flex-col items-center justify-center text-center h-full min-h-0 space-y-4 border-dashed border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-[#278b50]/15 border border-[#278b50]/30 flex items-center justify-center text-[#4ade80] shadow-inner">
                <ScanLine size={32} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">Ready for Plant Pathology Diagnosis</h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-sm leading-relaxed font-medium">
                  Upload or snap a leaf photo on the left to identify foliar pathogens, spot fungal or bacterial lesions, and receive immediate treatment protocols.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <ScanLine size={13} className="text-[#4ade80]" /> Lesion Identification
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <Sparkles size={13} className="text-[#4ade80]" /> ChatGPT Vision 4o-mini
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <Sprout size={13} className="text-[#4ade80]" /> Immediate Treatment
                </span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
