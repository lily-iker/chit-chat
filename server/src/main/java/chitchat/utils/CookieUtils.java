package chitchat.utils;

import jakarta.servlet.http.Cookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtils {

    public String getCookieValue(Cookie[] cookies, String cookieName) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public Cookie createCookie(String name,
                               String value,
                               int maxAge,
                               boolean httpOnly,
                               boolean secure,
                               String path,
                               String sameSite // "Strict", "Lax", or "None"
    ) {
        Cookie cookie = new Cookie(name, value);
        cookie.setMaxAge(maxAge);
        cookie.setHttpOnly(httpOnly);
        cookie.setSecure(secure);
        cookie.setPath(path);
        cookie.setAttribute("SameSite", sameSite);
        return cookie;
    }

}
