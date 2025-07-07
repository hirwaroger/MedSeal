// OCR utilities for PDF text extraction

// Load Tesseract.js dynamically from CDN
const loadTesseract = async () => {
  if (window.Tesseract) {
    return window.Tesseract;
  }

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js';
  document.head.appendChild(script);

  return new Promise((resolve) => {
    script.onload = () => {
      resolve(window.Tesseract);
    };
  });
};

// Load PDF.js dynamically
const loadPdfJs = async () => {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.js';
  document.head.appendChild(script);

  return new Promise((resolve) => {
    script.onload = () => {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.js';
      resolve(pdfjsLib);
    };
  });
};

export const extractTextFromPDF = async (file, onProgress = () => {}) => {
  try {
    onProgress('Loading PDF.js library...');
    const pdfjsLib = await loadPdfJs();

    onProgress('Loading Tesseract.js library...');
    const Tesseract = await loadTesseract();

    onProgress('Reading PDF file...');
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    onProgress('Loading PDF document...');
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    const totalPages = pdf.numPages;

    onProgress(`PDF loaded: ${totalPages} page(s). Starting OCR...`);

    let fullText = '';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress(`Processing page ${pageNum} of ${totalPages}...`);

      const page = await pdf.getPage(pageNum);
      const scale = 2; // Higher scale for better OCR accuracy
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      onProgress(`Running OCR on page ${pageNum}...`);

      // Convert canvas to image data for OCR
      const imageData = canvas.toDataURL('image/png');

      // Perform OCR on the page
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            onProgress(`OCR progress page ${pageNum}: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Add page separator and text
      if (totalPages > 1) {
        fullText += `\n\n===== Page ${pageNum} =====\n\n`;
      }
      fullText += text.trim();
    }

    onProgress('✅ OCR complete!');
    return fullText.trim();

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
};

// Utility to validate if file is PDF
export const isPDF = (file) => {
  return file && file.type === 'application/pdf';
};

// Utility to get file size in readable format
export const getFileSize = (file) => {
  const bytes = file.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
