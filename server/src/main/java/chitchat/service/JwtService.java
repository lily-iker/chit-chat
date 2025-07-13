package chitchat.service;

import chitchat.model.enumeration.TokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String ISSUER = "https://github.com/lily-iker";
    private static final String SCOPE = "scope";

    @Value("${jwt.accessExpiryTime}")
    private int accessExpiryTime;

    @Value("${jwt.refreshExpiryTime}")
    private int refreshExpiryTime;

    @Value("${jwt.secretKey}")
    private String secretKey;

    @Value("${jwt.refreshKey}")
    private String refreshKey;

    public String generateAccessToken(UserDetails userDetails) {
        return generateToken(Map.of(SCOPE, buildScope(userDetails.getAuthorities())),
                userDetails,
                TokenType.ACCESS_TOKEN,
                accessExpiryTime
        );
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(),
                userDetails,
                TokenType.REFRESH_TOKEN,
                refreshExpiryTime
        );
    }

    public String generateToken(Map<String, Object> claims, UserDetails userDetails, TokenType tokenType, int expiryTime) {
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .issuer(ISSUER)
                .expiration(new Date(System.currentTimeMillis() + expiryTime))
                .signWith(getKey(tokenType))
                .compact();
    }

    public boolean isValidToken(String token, TokenType tokenType, UserDetails userDetails) {
        String username = extractUsername(token, tokenType);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token, tokenType);
    }

    public String extractUsername(String token, TokenType tokenType) {
        return extractClaims(token, tokenType, Claims::getSubject);
    }

    public Date extractExpired(String token, TokenType tokenType) {
        return extractClaims(token, tokenType, Claims::getExpiration);
    }

    public boolean isTokenExpired(String token, TokenType tokenType) {
        return extractExpired(token, tokenType).before(new Date());
    }

    private Key getKey(TokenType tokenType) {
        if (TokenType.ACCESS_TOKEN.equals(tokenType)){
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
        }
        else if (TokenType.REFRESH_TOKEN.equals(tokenType)) {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshKey));
        }
        else {
            throw new IllegalArgumentException("Invalid token type: " + tokenType);
        }
    }

    private <T> T extractClaims(String token, TokenType tokenType, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith((SecretKey) getKey(tokenType))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claimsResolver.apply(claims);
    }

    private String buildScope(Collection <? extends GrantedAuthority> authorities) {
        StringJoiner result = new StringJoiner(" ");
        authorities.forEach(authority -> result.add(authority.toString()));
        return result.toString();
    }
}
