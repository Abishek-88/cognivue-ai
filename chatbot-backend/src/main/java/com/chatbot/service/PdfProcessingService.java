package com.chatbot.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfProcessingService {

    private static final int CHUNK_SIZE     = 1000;  // characters per chunk
    private static final int CHUNK_OVERLAP  = 200;   // overlap between chunks
    private static final int MIN_TEXT_LEN   = 100;   // below this = treat as scanned

    // ─── Main Entry Point ────────────────────────────────────────────────────────

    public PdfExtractionResult extractText(MultipartFile file) throws IOException {
        File tempFile = File.createTempFile("pdf_", ".pdf");
        file.transferTo(tempFile);

        try (PDDocument document = PDDocument.load(tempFile)) {
            int pageCount = document.getNumberOfPages();
            String extractedText = extractWithPdfBox(document);

            boolean isScanned = extractedText.trim().length() < MIN_TEXT_LEN;

            if (isScanned) {
                log.info("Scanned PDF detected, running OCR...");
                extractedText = extractWithTesseract(document);
            }

            List<String> chunks = chunkText(extractedText);

            return PdfExtractionResult.builder()
                    .text(extractedText)
                    .chunks(chunks)
                    .pageCount(pageCount)
                    .isScanned(isScanned)
                    .build();
        } finally {
            Files.deleteIfExists(tempFile.toPath());
        }
    }

    // ─── PDFBox Text Extraction ──────────────────────────────────────────────────

    private String extractWithPdfBox(PDDocument document) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        return stripper.getText(document);
    }

    // ─── Tesseract OCR Extraction ────────────────────────────────────────────────

    private String extractWithTesseract(PDDocument document) {
        try {
            Tesseract tesseract = new Tesseract();
            // Point to tessdata — install via: sudo apt-get install tesseract-ocr
            tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
            tesseract.setLanguage("eng+hin+tam");

            PDFRenderer renderer = new PDFRenderer(document);
            StringBuilder text = new StringBuilder();

            for (int page = 0; page < document.getNumberOfPages(); page++) {
                BufferedImage image = renderer.renderImageWithDPI(page, 300);
                File pageImg = File.createTempFile("ocr_page_" + page, ".png");
                ImageIO.write(image, "PNG", pageImg);

                try {
                    String pageText = tesseract.doOCR(pageImg);
                    text.append(pageText).append("\n");
                } finally {
                    Files.deleteIfExists(pageImg.toPath());
                }
            }
            return text.toString();
        } catch (Exception e) {
            log.error("OCR failed: {}", e.getMessage());
            return "";
        }
    }

    // ─── Text Chunking ───────────────────────────────────────────────────────────

    public List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        // Split by paragraphs first
        String[] paragraphs = text.split("\n\n+");
        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            paragraph = paragraph.trim();
            if (paragraph.isEmpty()) continue;

            if (currentChunk.length() + paragraph.length() > CHUNK_SIZE) {
                if (!currentChunk.isEmpty()) {
                    chunks.add(currentChunk.toString().trim());
                    // Keep overlap
                    String chunkStr = currentChunk.toString();
                    int overlapStart = Math.max(0, chunkStr.length() - CHUNK_OVERLAP);
                    currentChunk = new StringBuilder(chunkStr.substring(overlapStart));
                }
            }
            currentChunk.append(paragraph).append("\n\n");
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(currentChunk.toString().trim());
        }

        log.info("Text chunked into {} chunks", chunks.size());
        return chunks;
    }

    // ─── Result DTO ──────────────────────────────────────────────────────────────

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PdfExtractionResult {
        private String text;
        private List<String> chunks;
        private int pageCount;
        private boolean isScanned;
    }
}
