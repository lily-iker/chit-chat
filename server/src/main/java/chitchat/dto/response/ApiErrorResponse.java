package chitchat.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Date;

@Getter
@Setter
@Builder
public class ApiErrorResponse implements Serializable {
    private Date timestamp;
    private int status;
    private String error;
    private String path;
    private String message;
}
