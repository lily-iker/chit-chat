package chitchat.service;

import chitchat.model.security.CustomUserDetails;
import chitchat.service.interfaces.UserService;
import io.getstream.exceptions.StreamException;
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

    private final UserService userService;

    public String createStreamToken() throws StreamException {
        CustomUserDetails customUserDetails = userService.getCurrentUser();

        StreamSDKClient client = new StreamSDKClient(apiKey, secretKey);

        return client.tokenBuilder().createToken(customUserDetails.getUser().getId());
    }
}
