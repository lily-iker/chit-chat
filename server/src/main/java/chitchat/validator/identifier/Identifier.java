package chitchat.validator.identifier;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = IdentifierValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface Identifier {
    String message() default "Must be a valid email or username (min 8 characters)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}