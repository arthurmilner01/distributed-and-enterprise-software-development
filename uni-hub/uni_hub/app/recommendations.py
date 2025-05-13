from django.db import models
from django.db.models import Count, Q
from .models import Community, Keyword, UserCommunity, User, Follow

def get_community_recommendations_by_joined_keywords(user, limit=5):
    """
    Generates community recommendations for a given user.

    Recommendations are based on matching keywords from communities the user
    is already a member of. Communities are ranked by the number of shared keywords.
    Communities the user owns or is already a member of are excluded.
    """
    if not user or not user.is_authenticated:
        # Return an empty QuerySet if the user is not valid or not logged in.
        return Community.objects.none()

    # Get IDs of communities the user is currently a member of.
    joined_community_ids = list(UserCommunity.objects.filter(user=user).values_list('community_id', flat=True))

    if not joined_community_ids:
        # If user hasn't joined any communities return none
        return Community.objects.none()

    # Collect all unique Keyword IDs from the communities the user has joined.
    relevant_keyword_ids = set(
        Keyword.objects.filter(communities__id__in=joined_community_ids)
        .values_list('id', flat=True)
        .distinct()
    )

    if not relevant_keyword_ids:
        # Handle case where joined communities have no keywords assigned
        # Returning none as not valid recommendations
        return Community.objects.none()

    # Exclude communities the user owns
    owned_community_ids = set(Community.objects.filter(is_community_owner=user).values_list('id', flat=True))
    # Combine joined and owned IDs to exclude from recommendations
    exclude_ids = set(joined_community_ids).union(owned_community_ids)

    # Find, score, and order potential community recommendations.
    recommended_communities_qs = Community.objects.exclude(
        id__in=exclude_ids # Don't recommend communities the user owns or is in.
    ).filter(
        keywords__id__in=relevant_keyword_ids # Only consider communities with relevant keywords.
    ).annotate(
        # Count how many relevant keywords this community has.
        match_score=Count('keywords', filter=Q(keywords__id__in=relevant_keyword_ids))
    ).filter(
        match_score__gt=0 # Ensure there's at least one matching keyword.
    ).order_by(
        '-match_score', # Prioritize communities with more matching keywords.
        '-id' # Use creation order (newest first) as a tie-breaker.
    )

    # Limit the number of recommendations returned visually
    # Return the list of recommendations
    return recommended_communities_qs[:limit]


# Gets recommended profiles for the user based on mutual followers
def get_user_recommendations_mutuals(user, limit=5):
    """
    Generates user recommendations based on mutual follows

    Identifies users followed by people the current user follows.
    Excludes the current user and users they already follow.
    Ranks results by the number of mutual connections.
    """

    # If user not signed-in
    if not user or not user.is_authenticated:
        return User.objects.none()

    # Get IDs of users the current user follows
    following_ids = set(Follow.objects.filter(
        following_user=user
    ).values_list('followed_user_id', flat=True))

    if not following_ids:
        # User isn't following anyone
        return User.objects.none()

    # Create set of User IDs to exclude from recommendations.
    exclude_ids = following_ids.union({user.id}) # Exclude self + already followed users.

    # Find potential profiles and calculate mutual follow score.
    candidates_qs = User.objects.exclude(
        id__in=exclude_ids # Apply exclusions
    ).annotate(
        # Calculate mutual_follows count on how many people followed by the current user
        # also follow this candidate user.
        # Uses the 'followers' related_name from the Follow model.
        mutual_follows=Count(
            'followers',
            filter=Q(followers__following_user_id__in=following_ids)
        )
    )

    # Filter out candidates with zero mutual follows.
    candidates_qs_filtered = candidates_qs.filter(
        mutual_follows__gt=0
    )

    # Order the results by highest mutual score first, then random for ties
    candidates_qs_ordered = candidates_qs_filtered.order_by(
        '-mutual_follows',
        '?' # Random ordering for tie-breaking
    )

    # Limit the final number of recommendations visually
    final_results = candidates_qs_ordered[:limit]

    # Return the user recommendations
    return final_results