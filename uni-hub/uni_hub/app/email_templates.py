from djoser.email import ActivationEmail, PasswordResetEmail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

# Custom html which is used in the activation email
class CustomActivationEmail(ActivationEmail):
    template_name = "email/activation.html"

# Custom html which is used in the password reset email
class CustomPasswordResetEmail(PasswordResetEmail):
    template_name = "email/password-reset.html"


class AnnouncementNotificationEmail:
    @staticmethod
    def send_notification(recipient, announcement, community):
        context = {
            'recipient': recipient,
            'announcement': announcement,
            'community': community
        }
        
        # Render the subject separately
        subject = render_to_string('email/announcement_notification_subject.html', context)
        # Render the body separately
        text_body = render_to_string('email/announcement_notification_body.html', context)
        
        msg = EmailMultiAlternatives(
            subject=subject.strip(),  # Strip whitespace
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient.email]
        )
        msg.send()

class RSVPNotificationEmail:
    @staticmethod
    def send_notification(event, user, rsvp_status):
        #Determine the event creator (community leader or event manager)
        community = event.community
        event_creator = community.is_community_owner
        
        #Determine action text based on status
        rsvp_action = "accepted" if rsvp_status == "Accepted" else "updated their RSVP for"
        
        context = {
            'event': event,
            'user': user,
            'event_creator': event_creator,
            'rsvp_status': rsvp_status,
            'rsvp_action': rsvp_action
        }
        
        # Render the subject separately
        subject = render_to_string('email/rsvp_notification_subject.html', context)
        # Render the body separately
        text_body = render_to_string('email/rsvp_notification_body.html', context)
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[event_creator.email]
        )
        msg.send()