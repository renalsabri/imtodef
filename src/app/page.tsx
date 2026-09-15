'use client';

import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  RotateCw, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FileCheck2, 
  ArrowRight,
  ImageIcon,
  Loader2,
  PenLine
} from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
  name: string;
  size: number;
}

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pdfName, setPdfName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image files selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validImages = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    const newImages: UploadedImage[] = validImages.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      name: file.name,
      size: file.size,
    }));

    setImages((prev) => [...prev, ...newImages]);
    setSuccessMessage(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Remove single image
  const removeImage = (id: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Rotate single image (clockwise by 90 degrees)
  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  // Move image position (reorder pages)
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  // Convert image to rotated data URL using Canvas
  const processImageToDataUrl = (
    imageItem: UploadedImage
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const isRotatedQuarter =
          imageItem.rotation === 90 || imageItem.rotation === 270;
        const width = isRotatedQuarter ? img.height : img.width;
        const height = isRotatedQuarter ? img.width : img.height;

        canvas.width = width;
        canvas.height = height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageItem.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width,
          height,
        });
      };
      img.onerror = reject;
      img.src = imageItem.previewUrl;
    });
  };

  // Generate and download PDF offline
  const convertToPdf = async () => {
    if (images.length === 0 || isGenerating) return;

    try {
      setIsGenerating(true);
      setSuccessMessage(null);

      // Create PDF document (A4 format)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10; // 10mm margins

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          doc.addPage();
        }

        const { dataUrl, width: imgWidth, height: imgHeight } =
          await processImageToDataUrl(images[i]);

        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const imgRatio = imgWidth / imgHeight;
        const pageRatio = usableWidth / usableHeight;

        let renderWidth = usableWidth;
        let renderHeight = usableHeight;
        let posX = margin;
        let posY = margin;

        if (imgRatio > pageRatio) {
          // Wider than page ratio
          renderWidth = usableWidth;
          renderHeight = usableWidth / imgRatio;
          posY = margin + (usableHeight - renderHeight) / 2;
        } else {
          // Taller than page ratio
          renderHeight = usableHeight;
          renderWidth = usableHeight * imgRatio;
          posX = margin + (usableWidth - renderWidth) / 2;
        }

        doc.addImage(dataUrl, 'JPEG', posX, posY, renderWidth, renderHeight);
      }

      const cleanedName = pdfName.trim();
      const fileName = cleanedName
        ? (cleanedName.toLowerCase().endsWith('.pdf') ? cleanedName : `${cleanedName}.pdf`)
        : `converted_images_${Date.now()}.pdf`;

      doc.save(fileName);
      setSuccessMessage(`Berhasil disimpan sebagai ${fileName}!`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFD7D7] flex flex-col items-center justify-start antialiased selection:bg-[#FF1F87]/20">
      {/* Mobile Frame Container (Max 422px width matching Figma Android frame) */}
      <div className="w-full max-w-[422px] min-h-screen flex flex-col items-center relative pb-8 shadow-sm">
        
        {/* Top Header Bar (Rectangle 4) */}
        <header className="w-full h-[44px] bg-[#B27878] rounded-b-[10px] flex items-center px-7 z-10 shadow-sm flex-shrink-0">
          {/* Badge Pill (Rectangle 5) */}
          <div className="bg-[#A56464] px-3 py-1 rounded-[6px] flex items-center justify-center">
            <span className="text-[#FFDCDC] text-[11px] font-mono tracking-tight font-normal">
              Img to PDF converter.
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full px-[26px] flex flex-col items-center gap-6 mt-6 flex-1 min-h-0">
          
          {/* Frame 1: Upload Dropzone Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full max-w-[324px] h-[231px] bg-[#FDBCBC] border border-dashed border-[#FF1F87]/95 rounded-[40px] flex flex-col items-center justify-center gap-[15px] p-6 cursor-pointer hover:bg-[#fcb3b3] transition-all duration-200 active:scale-[0.98] group flex-shrink-0"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Vector Illustration Icon Placeholder (96x96) */}
            <div className="w-[96px] h-[96px] bg-[#E59D9D] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-inner">
              <div className="relative flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-[#FDBCBC]" strokeWidth={1.5} />
                <div className="absolute -bottom-1 -right-1 bg-[#DF7A7A] rounded-full p-1 text-white shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Tambah Gambar Label */}
            <p className="text-[14px] leading-[18px] text-[#DF7A7A] font-mono text-center font-normal">
              Tambah Gambar
            </p>
          </div>

          {/* Rectangle 1: Preview Container (Empty or Filled) */}
          <section className="w-full max-w-[369px] h-[425px] bg-[#FDBCBC] rounded-[32px] p-5 flex flex-col relative shadow-sm flex-shrink-0">
            {images.length === 0 ? (
              /* Empty State: Belum ada gambar yang dipilih */
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-[30px] leading-[40px] text-[#DF7A7A] font-mono font-normal text-center select-none">
                  Belum ada gambar yang dipilih
                </p>
              </div>
            ) : (
              /* Populated State: List of selected images */
              <div className="flex flex-col h-full min-h-0">
                {/* Header count info */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E59D9D]/50 mb-3 flex-shrink-0">
                  <span className="text-xs text-[#DF7A7A] font-mono font-medium">
                    {images.length} Gambar Dipilih
                  </span>
                  <button
                    onClick={() => setImages([])}
                    className="text-[11px] text-[#A56464] hover:text-[#914646] font-mono underline cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>

                {/* Scrollable image items list */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar touch-pan-y overscroll-contain">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="bg-[#FFD7D7] rounded-2xl p-2.5 flex items-center gap-3 shadow-xs border border-[#E59D9D]/40 flex-shrink-0"
                    >
                      {/* Image Thumbnail with dynamic rotation */}
                      <div className="w-14 h-14 rounded-xl bg-[#FDBCBC] overflow-hidden flex items-center justify-center flex-shrink-0 relative border border-[#E59D9D]">
                        <img
                          src={image.previewUrl}
                          alt={image.name}
                          style={{
                            transform: `rotate(${image.rotation}deg)`,
                          }}
                          className="w-full h-full object-cover transition-transform duration-200"
                        />
                        <span className="absolute bottom-0.5 left-0.5 bg-[#A56464]/80 text-[#FFDCDC] text-[9px] px-1 rounded font-mono">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Info & Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#A56464] font-mono truncate font-medium">
                          {image.name}
                        </p>
                        <p className="text-[10px] text-[#B27878] font-mono">
                          {(image.size / 1024).toFixed(0)} KB{' '}
                          {image.rotation > 0 && `• ${image.rotation}°`}
                        </p>
                      </div>

                      {/* Action buttons (Rotate, Reorder, Delete) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Move Up */}
                        <button
                          disabled={index === 0}
                          onClick={() => moveImage(index, 'up')}
                          className="p-1 rounded-lg text-[#B27878] hover:bg-[#FDBCBC] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(index, 'down')}
                          className="p-1 rounded-lg text-[#B27878] hover:bg-[#FDBCBC] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Rotate 90 deg */}
                        <button
                          onClick={() => rotateImage(image.id)}
                          className="p-1 rounded-lg text-[#B27878] hover:bg-[#FDBCBC] active:rotate-90 transition-all cursor-pointer"
                          title="Putar 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => removeImage(image.id, image.previewUrl)}
                          className="p-1 rounded-lg text-[#A56464] hover:bg-[#FF1F87]/20 hover:text-[#FF1F87] cursor-pointer"
                          title="Hapus gambar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Action Section: PDF Filename Input & Convert Button */}
          <div className="w-full max-w-[369px] mt-auto flex flex-col gap-2.5 flex-shrink-0">
            {/* PDF Name Editor Bar */}
            <div className="w-full h-[42px] bg-[#FDBCBC] rounded-[20px] px-4 flex items-center gap-2.5 border border-[#E59D9D]/50 focus-within:border-[#FF1F87]/70 transition-all shadow-xs">
              <PenLine className="w-4 h-4 text-[#B27878] flex-shrink-0" />
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="Nama file PDF "
                className="w-full bg-transparent text-xs text-[#A56464] placeholder-[#DF7A7A]/70 font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] bg-[#E59D9D]/40 text-[#A56464] px-1.5 py-0.5 rounded font-mono font-medium flex-shrink-0 select-none">
                .pdf
              </span>
            </div>

            {/* Rectangle 3: Convert to PDF Button */}
            <button
              onClick={convertToPdf}
              disabled={images.length === 0 || isGenerating}
              className={`w-full h-[42px] bg-[#FDBCBC] rounded-[20px] flex items-center justify-center gap-2 font-mono font-medium text-[14px] transition-all duration-200 shadow-sm ${
                images.length === 0
                  ? 'opacity-60 cursor-not-allowed text-[#B27878]/70'
                  : 'hover:bg-[#fcabab] active:scale-[0.98] text-[#A56464] cursor-pointer'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#B27878] animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <span className="text-[#B27878]">Konversi ke PDF</span>
                  {/* Figma Vector indicator arrow rotated */}
                  <div className="w-5 h-5 bg-[#B27878] rounded-full flex items-center justify-center text-[#FDBCBC]">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="w-full max-w-[369px] bg-[#A56464] text-[#FFDCDC] text-xs font-mono py-2 px-3 rounded-xl flex items-center gap-2 animate-fade-in flex-shrink-0">
              <FileCheck2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{successMessage}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
