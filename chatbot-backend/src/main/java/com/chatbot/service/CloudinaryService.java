package com.chatbot.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public UploadResult uploadFile(MultipartFile file, String folder) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "raw",
                        "use_filename", true,
                        "unique_filename", true
                )
        );

        return UploadResult.builder()
                .publicId((String) result.get("public_id"))
                .secureUrl((String) result.get("secure_url"))
                .format((String) result.get("format"))
                .bytes(((Number) result.get("bytes")).longValue())
                .build();
    }

    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", "raw"));
        } catch (IOException e) {
            log.warn("Could not delete file from Cloudinary: {}", e.getMessage());
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UploadResult {
        private String publicId;
        private String secureUrl;
        private String format;
        private Long bytes;
    }
}
