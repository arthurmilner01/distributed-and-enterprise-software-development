# uni_hub/app/recommendations.py
from django.db import models # Make sure this is imported
from django.db.models import Count, Q # Import Q
# --- Ensure Follow model is imported ---
from .models import Community, Keyword, UserCommunity, User, Follow # Added Follow here

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
        '-id' # Secondary sort: Newer communities first (tie-breaker)
    )

    # 5. Limit the results
    # Note: The view's get_queryset now returns this QuerySet directly
    return recommended_communities_qs[:limit]


# ============================================
# USER RECOMMENDATION LOGIC WITH DEBUGGING
# ============================================
def get_user_recommendations_mutuals(user, limit=5):
    """
    Recommends users based on mutual follows ("friends of friends").
    Includes print statements for debugging.
    """
    print(f"\n--- Running User Recommendations for User ID: {user.id} ---") # DEBUG START

    if not user or not user.is_authenticated:
        print("User not authenticated, returning none.")
        return User.objects.none() # Return empty queryset for anonymous users

    # 1. Get IDs of users the current user follows
    following_ids = set(Follow.objects.filter(
        following_user=user
    ).values_list('followed_user_id', flat=True))
    print(f"DEBUG: User {user.id} follows IDs: {following_ids}") # DEBUG

    if not following_ids:
        # Cold start: User follows no one yet
        print(f"User {user.id} follows no one. Cannot recommend based on mutuals.")
        return User.objects.none()

    # 2. Define IDs to exclude (self + people already followed)
    exclude_ids = following_ids.union({user.id})
    print(f"DEBUG: Excluding User IDs: {exclude_ids}") # DEBUG

    # 3. Annotate potential candidates (Users) with the count of mutual follows
    #    Filter out users in exclude_ids
    candidates_qs = User.objects.exclude(
        id__in=exclude_ids # Exclude self and already followed
    ).annotate(
        # Count 'Follow' objects where this candidate is the 'followed_user'
        # AND the 'following_user' is someone the current user follows.
        # Assumes 'followers' is the related_name from Follow.followed_user back to User
        mutual_follows=Count(
            'followers', # The related name from Follow.followed_user back to User
            filter=Q(followers__following_user_id__in=following_ids)
        )
    )

    # --- DEBUGGING: Print candidate IDs and scores BEFORE filtering ---
    print(f"DEBUG: Candidates before final filter (ID, Score):")
    # Evaluate a small part of the queryset to see annotations
    evaluated_candidates_before_filter = list(candidates_qs[:20]) # Limit print output and evaluate
    for candidate in evaluated_candidates_before_filter:
        print(f"  - User ID: {candidate.id}, Mutual Score: {getattr(candidate, 'mutual_follows', 'N/A')}")
    # --- END DEBUGGING ---

    # --- Apply the filter AFTER debugging ---
    # Filter out those with no mutual follows AFTER annotation
    candidates_qs_filtered = candidates_qs.filter(
        mutual_follows__gt=0
    )
    print(f"DEBUG: Candidates *after* filtering mutual_follows > 0: {list(candidates_qs_filtered.values_list('id', flat=True))}") # DEBUG

    # Order the final candidates
    candidates_qs_ordered = candidates_qs_filtered.order_by(
        '-mutual_follows',
        '?' # Random tie-breaker
    )
    print(f"DEBUG: Final ordered candidates (before limit): {list(candidates_qs_ordered.values_list('id', flat=True))}") # DEBUG

    # 4. Limit the results
    final_results = candidates_qs_ordered[:limit]
    print(f"--- Returning final {len(final_results)} recommendations ---") # DEBUG END
    return final_results