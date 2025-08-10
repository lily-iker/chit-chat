package chitchat.service.interfaces;

import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserInfoResponse setUpMyBasicInfo(UserInfoRequest userInfoRequest, MultipartFile profileImageFile) throws Exception;
    UserInfoResponse getMyInfo();
    UserProfileResponse getOtherUserProfile(String userId);
}
