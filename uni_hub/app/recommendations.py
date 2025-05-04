# uni_hub/app/recommendations.py
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

    # 1. Get IDs of communities the user is currently a member of.
    joined_community_ids = list(UserCommunity.objects.filter(user=user).values_list('community_id', flat=True))

    if not joined_community_ids:
        # Handle the "cold start" problem: user hasn't joined any communities.
        print(f"User {user.id} hasn't joined any communities. No basis for keyword recommendations.")
        # Optional: Could return globally popular communities here instead of none.
        return Community.objects.none()

    # 2. Collect all unique Keyword IDs from the communities the user has joined.
    relevant_keyword_ids = set(
        Keyword.objects.filter(communities__id__in=joined_community_ids)
        .values_list('id', flat=True)
        .distinct()
    )

    if not relevant_keyword_ids:
        # Handle case where joined communities have no keywords assigned.
        print(f"Communities joined by user {user.id} have no keywords.")
        return Community.objects.none()

    # 3. Identify communities to exclude from recommendations.
    # Exclude communities the user owns.
    owned_community_ids = set(Community.objects.filter(is_community_owner=user).values_list('id', flat=True))
    # Combine joined and owned IDs for exclusion.
    exclude_ids = set(joined_community_ids).union(owned_community_ids)

    # 4. Find, score, and order potential community recommendations.
    recommended_communities_qs = Community.objects.exclude(
        id__in=exclude_ids # Don't recommend communities the user owns or is in.
    ).filter(
        keywords__id__in=relevant_keyword_ids # Only consider communities with relevant keywords.
    ).annotate(
        # Calculate the 'match_score': count how many relevant keywords this community has.
        match_score=Count('keywords', filter=Q(keywords__id__in=relevant_keyword_ids))
    ).filter(
        match_score__gt=0 # Ensure there's at least one matching keyword.
    ).order_by(
        '-match_score', # Prioritize communities with more matching keywords.
        '-id' # Use creation order (newest first) as a tie-breaker.
    )

    # 5. Limit the number of recommendations returned.
    # The final QuerySet is returned to the view.
    return recommended_communities_qs[:limit]


# USER RECOMMENDATION LOGIC (Mutual Followers)
def get_user_recommendations_mutuals(user, limit=5):
    """
    Generates user recommendations based on mutual follows ("friends of friends").

    Identifies users followed by people the current user follows.
    Excludes the current user and users they already follow.
    Ranks results by the number of mutual connections.
    Includes debugging print statements.
    """
    print(f"\n--- Running User Recommendations for User ID: {user.id} ---") # DEBUG START

    if not user or not user.is_authenticated:
        print("User not authenticated, returning none.")
        return User.objects.none()

    # 1. Get IDs of users the current user follows.
    following_ids = set(Follow.objects.filter(
        following_user=user
    ).values_list('followed_user_id', flat=True))
    print(f"DEBUG: User {user.id} follows IDs: {following_ids}") # DEBUG

    if not following_ids:
        # Handle cold start: User isn't following anyone.
        print(f"User {user.id} follows no one. Cannot recommend based on mutuals.")
        return User.objects.none()

    # 2. Create set of User IDs to exclude from recommendations.
    exclude_ids = following_ids.union({user.id}) # Exclude self + already followed users.
    print(f"DEBUG: Excluding User IDs: {exclude_ids}") # DEBUG

    # 3. Find potential candidates and calculate mutual follow score.
    candidates_qs = User.objects.exclude(
        id__in=exclude_ids # Apply exclusions.
    ).annotate(
        # Calculate 'mutual_follows': Count how many people followed by the current user
        # also follow this candidate user.
        # Uses the 'followers' related_name from the Follow model.
        mutual_follows=Count(
            'followers',
            filter=Q(followers__following_user_id__in=following_ids)
        )
    )

    # --- DEBUGGING: Check candidates before filtering score ---
    print(f"DEBUG: Candidates before final filter (ID, Score):")
    evaluated_candidates_before_filter = list(candidates_qs[:20]) # Limit debug output
    for candidate in evaluated_candidates_before_filter:
        print(f"  - User ID: {candidate.id}, Mutual Score: {getattr(candidate, 'mutual_follows', 'N/A')}")
    # --- END DEBUGGING ---

    # Filter out candidates with zero mutual follows.
    candidates_qs_filtered = candidates_qs.filter(
        mutual_follows__gt=0
    )
    print(f"DEBUG: Candidates *after* filtering mutual_follows > 0: {list(candidates_qs_filtered.values_list('id', flat=True))}") # DEBUG

    # Order the results: highest mutual score first, then random for ties.
    candidates_qs_ordered = candidates_qs_filtered.order_by(
        '-mutual_follows',
        '?' # Random ordering for tie-breaking.
    )
    print(f"DEBUG: Final ordered candidates (before limit): {list(candidates_qs_ordered.values_list('id', flat=True))}") # DEBUG

    # 4. Limit the final number of recommendations.
    final_results = candidates_qs_ordered[:limit]
    print(f"--- Returning final {len(final_results)} recommendations ---") # DEBUG END
    # The final QuerySet is returned.
    return final_results