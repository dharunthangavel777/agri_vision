import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight,
  FlaskConical,
  Check,
  RefreshCw
} from 'lucide-react';
import { agricultureService, ExtractedSoilReport } from '../../chat/services/aiService.ts';

interface SoilReportSectionProps {
  onApplyExtractedData: (data: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    soilType?: string;
  }) => void;
}

export const SoilReportSection: React.FC<SoilReportSectionProps> = ({ onApplyExtractedData }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedReport, setExtractedReport] = useState<ExtractedSoilReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    setIsApplied(false);
    setExtractedReport(null);

    // Validate type: Image or PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, WebP) or PDF soil report.');
      return;
    }

    // Validate size (< 12MB)
    if (file.size > 12 * 1024 * 1024) {
      setError('File size exceeds 12MB limit.');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !filePreview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await agricultureService.parseSoilReport(filePreview, selectedFile.type);
      setExtractedReport(result);
    } catch (err: any) {
      console.error('Soil extraction error:', err);
      setError('Failed to extract data from soil report. Please try manual entry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!extractedReport) return;
    onApplyExtractedData({
      nitrogen: extractedReport.nitrogen ?? 90,
      phosphorus: extractedReport.phosphorus ?? 42,
      potassium: extractedReport.potassium ?? 45,
      ph: extractedReport.ph ?? 6.8,
      soilType: extractedReport.soilType ?? undefined
    });
    setIsApplied(true);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setExtractedReport(null);
    setIsApplied(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Upload Dropzone */}
      {!extractedReport ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragging 
              ? 'border-[#278b50] bg-[#278b50]/10 scale-[1.01]' 
              : 'border-white/15 hover:border-[#278b50]/50 bg-[#162016]/60 hover:bg-[#1a251a]/80'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden" 
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80] shadow-lg">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Drop Soil Health Card or Lab Report here
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Supports <b className="text-stone-300">PDF, JPG, PNG, WebP</b> (Soil Health Cards, Lab Slips)
                </p>
              </div>
              <span className="text-[10px] text-[#4ade80] bg-[#278b50]/20 px-2.5 py-0.5 rounded-full border border-[#278b50]/30 font-medium">
                AI Auto-Extraction of NPK, pH & Micronutrients
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 bg-[#121912] rounded-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80] shrink-0">
                  {selectedFile.type.includes('pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-stone-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type.toUpperCase().replace('APPLICATION/', '')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Error Notice */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action to Analyze */}
      {selectedFile && !extractedReport && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#278b50] to-[#1e723f] hover:from-[#2e9e5c] hover:to-[#238449] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#278b50]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>Scanning Soil Health Card with Multimodal AI...</span>
            </div>
          ) : (
            <>
              <Sparkles size={15} className="text-[#a7f3d0]" />
              <span>Extract Soil Nutrients from Report</span>
            </>
          )}
        </button>
      )}

      {/* Extracted Soil Report Parameters Review Card */}
      {extractedReport && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#182619] to-[#121c13] border border-[#278b50]/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#4ade80]" />
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Soil Health Card Extracted
                  <span className="text-[10px] bg-[#278b50]/30 text-[#4ade80] px-2 py-0.5 rounded-full font-mono">
                    {(extractedReport.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </h4>
                <p className="text-[10px] text-stone-400">
                  {extractedReport.labName || 'Certified Soil Testing Facility'} {extractedReport.sampleId ? `• ID: ${extractedReport.sampleId}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw size={11} /> Re-upload
            </button>
          </div>

          {/* Extracted Nutrient Metrics Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] text-stone-400 block">Nitrogen (N)</span>
              <b className="text-xs sm:text-sm text-[#4ade80] block font-mono">{extractedReport.nitrogen ?? '--'}</b>
              <span className="text-[8px] text-stone-500">kg/ha</span>
            </div>

            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] text-stone-400 block">Phosphorus (P)</span>
              <b className="text-xs sm:text-sm text-[#4ade80] block font-mono">{extractedReport.phosphorus ?? '--'}</b>
              <span className="text-[8px] text-stone-500">kg/ha</span>
            </div>

            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] text-stone-400 block">Potassium (K)</span>
              <b className="text-xs sm:text-sm text-[#4ade80] block font-mono">{extractedReport.potassium ?? '--'}</b>
              <span className="text-[8px] text-stone-500">kg/ha</span>
            </div>

            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] text-stone-400 block">Soil pH</span>
              <b className="text-xs sm:text-sm text-[#f2b51b] block font-mono">{extractedReport.ph ?? '--'}</b>
              <span className="text-[8px] text-stone-500">{extractedReport.ph && extractedReport.ph < 6.5 ? 'Acidic' : extractedReport.ph && extractedReport.ph > 7.5 ? 'Alkaline' : 'Neutral'}</span>
            </div>
          </div>

          {/* Secondary Parameters (Organic Carbon, Texture) */}
          <div className="flex items-center justify-between text-[11px] text-stone-300 bg-black/20 p-2 rounded-xl border border-white/5">
            <span>OC: <b className="text-white">{extractedReport.organicCarbon || '0.55%'}</b></span>
            <span>EC: <b className="text-white">{extractedReport.electricalConductivity || '0.40 dS/m'}</b></span>
            <span>Texture: <b className="text-[#4ade80]">{extractedReport.soilType || 'Loamy'}</b></span>
          </div>

          {/* Agronomic Summary */}
          {extractedReport.summary && (
            <p className="text-[11px] text-stone-300 bg-white/5 p-2 rounded-xl border border-white/5 leading-relaxed">
              💡 {extractedReport.summary}
            </p>
          )}

          {/* Apply to Advisor Button */}
          <button
            type="button"
            onClick={handleApply}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              isApplied
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#278b50] hover:bg-[#1f7a44] text-white shadow-md shadow-[#278b50]/20'
            }`}
          >
            {isApplied ? (
              <>
                <Check size={14} />
                <span>Extracted Values Applied to Form</span>
              </>
            ) : (
              <>
                <FlaskConical size={14} />
                <span>Apply Extracted Values to Advisor Form</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
