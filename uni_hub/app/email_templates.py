from djoser.email import ActivationEmail, PasswordResetEmail

# Custom html which is used in the activation email
class CustomActivationEmail(ActivationEmail):
    template_name = "email/activation.html"

# Custom html which is used in the password reset email
class CustomPasswordResetEmail(PasswordResetEmail):
    template_name = "email/password-reset.html"
