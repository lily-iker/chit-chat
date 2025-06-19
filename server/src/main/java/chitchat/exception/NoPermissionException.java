package chitchat.exception;

public class NoPermissionException extends RuntimeException {
  public NoPermissionException() {
    super();
  }

  public NoPermissionException(String message) {
    super(message);
  }

  public NoPermissionException(String message, Throwable cause) {
    super(message, cause);
  }

  public NoPermissionException(Throwable cause) {
    super(cause);
  }
}