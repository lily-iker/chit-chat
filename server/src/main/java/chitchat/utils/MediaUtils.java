package chitchat.utils;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MediaUtils {

    @Value("${minio.url}")
    private String mediaBaseUrl;

    public String resolveMediaUrl(String path) {
        return StringUtils.hasText(path)
                ? mediaBaseUrl + (mediaBaseUrl.endsWith("/") ? "" : "/") + path
                : null;
    }
}