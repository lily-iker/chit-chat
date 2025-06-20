package chitchat.service;

import io.minio.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Service
public class MinioService {

    private static final int PRIVATE_URL_EXPIRY_DAYS = 14;

    private final MinioClient minioClient;
    private final String publicBucket;
    private final String privateBucket;

    @PostConstruct
    public void init() {
        createBucketIfNotExists(publicBucket);
        createBucketIfNotExists(privateBucket);
        setPublicBucketPolicy();
    }

    private void createBucketIfNotExists(String bucketName) {
        try {
            boolean isExist = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            if (!isExist) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bucket or check if it exists: " + bucketName, e);
        }
    }

    // Make the public bucket accessible to anyone
    private void setPublicBucketPolicy() {
        String policy = getPublicBucketPolicy(publicBucket);
        try {
            minioClient.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(publicBucket)
                            .config(policy)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to set public bucket policy for " + publicBucket, e);
        }
    }

    private String getPublicBucketPolicy(String bucketName) {
        return """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": "*",
                            "Action": ["s3:GetObject"],
                            "Resource": ["arn:aws:s3:::%s/*"]
                        }
                    ]
                }
                """.formatted(bucketName);
    }

    public String uploadFileToPublicBucket(MultipartFile file) throws Exception {
        return uploadFile(file, publicBucket);
    }

    public String uploadFileToPrivateBucket(MultipartFile file) throws Exception {
        return uploadFile(file, privateBucket);
    }

    private String uploadFile(MultipartFile file, String bucketName) throws Exception {
        String randomFileName = UUID.randomUUID() + getFileExtension(Objects.requireNonNull(file.getOriginalFilename()));

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(randomFileName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );

        return bucketName + "/" + randomFileName;
    }

    private String getFileExtension(String originalFileName) {
        int lastDotIndex = originalFileName.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return originalFileName.substring(lastDotIndex); // e.g., ".jpg", ".png"
        }
        return ""; // Return empty string if no extension is found
    }

    public String getPresignedUrlForPublicBucket(String fileName) throws Exception {
        return getPresignedUrl(fileName, publicBucket);
    }

    public String getPresignedUrlForPrivateBucket(String fileName) throws Exception {
        return getPresignedUrl(fileName, privateBucket);
    }

    private String getPresignedUrl(String fileName, String bucketName) throws Exception {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(bucketName)
                        .object(fileName)
                        .expiry(PRIVATE_URL_EXPIRY_DAYS, TimeUnit.DAYS)
                        .build()
        );
    }

    public void deleteFileFromPublicBucket(String fileName) throws Exception {
        deleteFile(fileName, publicBucket);
    }


    public void deleteFileFromPrivateBucket(String fileName) throws Exception {
        deleteFile(fileName, privateBucket);
    }

    private void deleteFile(String fileName, String bucketName) throws Exception {
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .build()
        );
    }
}
