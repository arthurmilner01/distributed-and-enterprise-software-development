# uni_hub/app/recommendations.py
from django.db import models # Make sure this is imported
from django.db.models import Count, Q # Import Q
from .models import Community, Keyword, UserCommunity, User # Ensure correct imports

def get_community_recommendations_by_joined_keywords(user, limit=5):
    """
    Recommends communities based on keywords from communities the user has joined.
    Ranks by the number of shared keywords.
    """
    if not user or not user.is_authenticated:
        return Community.objects.none()

    # 1. Find IDs of communities user is a member of
    joined_community_ids = list(UserCommunity.objects.filter(user=user).values_list('community_id', flat=True))

    if not joined_community_ids:
        print(f"User {user.id} hasn't joined any communities.")
        # Optional: Return popular communities if desired for cold start
        return Community.objects.none()

    # 2. Get all unique Keyword IDs associated with the user's joined communities
    relevant_keyword_ids = set(
        Keyword.objects.filter(communities__id__in=joined_community_ids)
        .values_list('id', flat=True)
        .distinct()
    )

    if not relevant_keyword_ids:
        print(f"Communities joined by user {user.id} have no relevant keywords.")
        return Community.objects.none()

    # 3. Find candidate communities (exclude owned or already member)
    owned_community_ids = set(Community.objects.filter(is_community_owner=user).values_list('id', flat=True))
    exclude_ids = set(joined_community_ids).union(owned_community_ids)

    # 4. Find, Annotate (Score), and Order Candidates
    recommended_communities_qs = Community.objects.exclude(
        id__in=exclude_ids
    ).filter(
        keywords__id__in=relevant_keyword_ids # Ensure candidate has at least one match
    ).annotate(
        # Count how many of *this community's* keywords are in the relevant set
        match_score=Count('keywords', filter=Q(keywords__id__in=relevant_keyword_ids))
    ).filter(
        match_score__gt=0 # Keep communities with at least one match
    ).order_by(
        '-match_score', # Primary sort: Higher score first
        # '-member_count', # <<<--- THIS LINE IS REMOVED ---<<<
        '-id' # Secondary sort: Newer communities first (tie-breaker)
    )

    # 5. Limit the results
    # Note: The view's get_queryset now returns this QuerySet directly
    return recommended_communities_qs[:limit]