package chitchat.service;

import chitchat.model.security.CustomUserDetails;
import chitchat.security.service.CurrentUserService;
import io.getstream.services.framework.StreamSDKClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StreamService {

    @Value("${stream.apiKey}")
    private String apiKey;

    @Value("${stream.secretKey}")
    private String secretKey;

    private final CurrentUserService currentUserService;

    public String createStreamToken() {
        CustomUserDetails customUserDetails = currentUserService.getCurrentUser();

        StreamSDKClient client = new StreamSDKClient(apiKey, secretKey);

        return client.tokenBuilder().createToken(customUserDetails.getUser().getId());
    }
}
