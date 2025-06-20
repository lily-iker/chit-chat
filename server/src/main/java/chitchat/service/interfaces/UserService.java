package chitchat.service.interfaces;

import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.model.security.CustomUserDetails;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    CustomUserDetails getCurrentUser();
    UserInfoResponse setUpMyBasicInfo(UserInfoRequest userInfoRequest, MultipartFile profileImageFile) throws Exception;
    UserInfoResponse getMyInfo();
    PageResponse<?> searchUsers(String query, int pageNumber, int pageSize, String sortBy, String sortDirection);
}
