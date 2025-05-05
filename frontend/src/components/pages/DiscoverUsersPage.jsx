import { useAuth } from "../../context/AuthContext";
// Import memo and useCallback from React
import React, { useState, useEffect, memo, useCallback } from "react";

import { Alert } from 'react-bootstrap';
// Import necessary icons from lucide-react
import { Search, UserPlus, UserX, Building  } from "lucide-react";
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const UserCard = memo(({ userToDisplay, onFollow, onUnfollow, onViewProfile, currentUserId }) => {
    const isCurrentUser = userToDisplay.id === currentUserId;
    // console.log(`Rendering UserCard for ${userToDisplay.id}`); // Optional: Keep for debugging renders

    return (
        <div className="card h-100 shadow-sm">
             <div className="card-body text-center d-flex flex-column"> {/* Added flex column */}
                <img
                    src={userToDisplay.profile_picture_url || default_profile_picture}
                    alt={`${userToDisplay.first_name} ${userToDisplay.last_name}`}
                    className="rounded-circle mb-2 align-self-center" // Center image
                    width="70" height="70" // Consistent smaller size for cards
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.src = default_profile_picture; }}
                />
                <h5 className="card-title h6 text-truncate" title={`${userToDisplay.first_name} ${userToDisplay.last_name}`}>
                    {userToDisplay.first_name} {userToDisplay.last_name}
                </h5>
                {userToDisplay.university && (
                    <p className="card-text text-muted small mb-2 text-truncate">
                        <Building size={12} className="me-1" />
                        {/* Adjust based on actual field name from serializer */}
                        {userToDisplay.university?.university_name || userToDisplay.university?.name}
                    </p>
                )}
                 {/* Display Bio if available */}
                 {userToDisplay.bio && (
                    <p className="card-text small" style={{ minHeight: '30px', overflow: 'hidden' }}>
                        {userToDisplay.bio.substring(0, 50)}{userToDisplay.bio.length > 50 ? '...' : ''}
                     </p>
                )}
                {/* Display Interests if available */}
                {userToDisplay.interests_list && userToDisplay.interests_list.length > 0 && (
                    <div className="mt-1 mb-2">
                        <div className="d-flex flex-wrap justify-content-center gap-1 mt-1">
                            {userToDisplay.interests_list.slice(0, 3).map((interest, index) => (
                                <span key={index} className="badge bg-secondary">
                                    {interest.interest}
                                </span>
                            ))}
                            {userToDisplay.interests_list.length > 3 && (
                                <span className="badge bg-light text-secondary">+{userToDisplay.interests_list.length - 3}</span>
                            )}
                        </div>
                    </div>
                )}
                <div className="mt-auto d-flex justify-content-around pt-2"> {/* Buttons at bottom */}
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => onViewProfile(userToDisplay.id)}>Profile</button>
                    {!isCurrentUser && ( // Don't show follow button for self
                        userToDisplay.is_following ? (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => onUnfollow(userToDisplay.id)}> <UserX size={14} className="me-1"/> Unfollow</button>
                        ) : (
                            <button className="btn btn-sm btn-info" onClick={() => onFollow(userToDisplay.id)}> <UserPlus size={14} className="me-1"/> Follow</button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
});
// --- END UserCard Definition ---


const DiscoverUsersPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const api = useApi();

    //Search state (Original)
    const [searchQuery, setSearchQuery] = useState("");
    const [universityFilter, setUniversityFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("last_name");

    // Interest filter state
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [interestOptions, setInterestOptions] = useState([]);
    //Results state (Original)
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]);

    //UI state (Original)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    //User Recommendation State <---
    const [recommendedUsers, setRecommendedUsers] = useState({ mutuals: [], interest_based: [] });
    const [isUserRecLoading, setIsUserRecLoading] = useState(false);
    const [userRecError, setUserRecError] = useState('');

    //Pagination state (Original)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // --- Fetching Functions ---

    //Fetch universities (Original Function)
    const fetchUniversities = async () => {
        try {
            const response = await api.get("api/universities/list/");
            setUniversities(response.data || []);
        } catch (error) {
            console.error("Error fetching universities:", error);
            setErrorMessage("Failed to fetch universities. Please try again.");
        }
    };

    // Fetch Interest Suggestions
    const fetchInterestSuggestions = async (inputValue) => {
        if (!inputValue) return;

        try {
            const response = await api.get(`/api/interests/suggestions/?query=${encodeURIComponent(inputValue)}`);
            setInterestOptions(response.data || []);
        } catch (error) {
            console.error("Error fetching interest suggestions:", error);
            setInterestOptions([]);
        }
    };

     //  Fetch User Recommendations Function <---
     const fetchUserRecommendations = useCallback(async () => { // Wrapped in useCallback
        // Prevent fetching if not authenticated or already loading
        if (!isAuthenticated || !user || isUserRecLoading) return;

        setIsUserRecLoading(true);
        setUserRecError('');
        try {
            // Use the api instance available in the component scope
            const response = await api.get('/api/recommendations/users/', { params: { limit: 6 } });
            setRecommendedUsers({
                 mutuals: response.data?.mutuals || [],
                 interest_based: response.data?.interest_based || []
             });
            console.log("Fetched Recommendations:", response.data); // Keep debug log
        } catch (err) {
            console.error("Error fetching user recommendations:", err);
            setUserRecError('Could not load user recommendations.');
            setRecommendedUsers({ mutuals: [], interest_based: [] });
        } finally {
            setIsUserRecLoading(false);
        }
    }, [api, user, isAuthenticated, isUserRecLoading]); 
   


    //Perform the user search API call (Original Function - takes args)
    const performSearch = useCallback(async (query = searchQuery, uni = universityFilter, interests = selectedInterests, sort = sortOrder, page = currentPage) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            let params = new URLSearchParams();
            if (query) params.append("search", query);
            if (uni !== "all") params.append("university", uni);
            
            // Add interests filter - ensure interests is an array before using map
            if (interests && Array.isArray(interests) && interests.length > 0) {
                const interestStrings = interests.map(option => 
                    typeof option === 'string' ? option : option.interest
                );
                params.append("interests", interestStrings.join(','));
            }
            
            params.append("ordering", sort);
            params.append("page", page.toString());

            const response = await api.get(`/api/users/?${params.toString()}`);

            setUsers(response.data.results || []);
            setTotalItems(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);

            // Simple page correction if needed
            if (response.data.total_pages > 0 && page > response.data.total_pages) {
                setCurrentPage(response.data.total_pages);
            }
        } catch (error) {
            console.error("Error searching users:", error);
            setErrorMessage("Failed to search users. Please try again.");
            setUsers([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [api]);



    // Initial data load
    useEffect(() => {
        fetchUniversities();
        // Initial search on first render
        if (isAuthenticated) {
            fetchUserRecommendations();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Only depends on authentication status

    // Search when filters/page change
    useEffect(() => {
        performSearch(searchQuery, universityFilter, selectedInterests, sortOrder, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [universityFilter, sortOrder, currentPage]); // Add searchQuery to dependencies


    // --- Action Handlers (Wrapped in useCallback) ---

    const handleSearch = useCallback((e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        performSearch(searchQuery, universityFilter, selectedInterests, sortOrder, 1);
    }, [searchQuery, universityFilter, selectedInterests, sortOrder, performSearch]);

    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
    }, []); 

    const handleFollow = useCallback(async (userIdToFollow) => {
        setSuccessMessage(""); setErrorMessage("");
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.post('api/follow/follow/', { user_id: userIdToFollow });
            setSuccessMessage("User followed successfully.");
            const updateUserState = (u) => u.id === userIdToFollow ? { ...u, is_following: true } : u;
            setUsers(currentUsers => currentUsers.map(updateUserState));
            setRecommendedUsers(prevRecs => ({
                 mutuals: prevRecs.mutuals.filter(u => u.id !== userIdToFollow),
                 interest_based: prevRecs.interest_based.filter(u => u.id !== userIdToFollow)
             }));
            // await fetchUserRecommendations(); // Optional: refetch to get new recs
        } catch (error) {
            console.error("Error following user:", error);
            setErrorMessage(error.response?.data?.error || "Failed to follow user.");
        }
    }, [api, isAuthenticated, navigate]); // Add dependencies

    const handleUnfollow = useCallback(async (userIdToUnfollow) => {
         setSuccessMessage(""); setErrorMessage("");
         if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.delete(`api/follow/unfollow/?user_id=${userIdToUnfollow}`);
            setSuccessMessage("User unfollowed successfully.");
             const updateUserState = (u) => u.id === userIdToUnfollow ? { ...u, is_following: false } : u;
             setUsers(currentUsers => currentUsers.map(updateUserState));
             // Recommendation update usually not needed on unfollow
        } catch (error) {
            console.error("Error unfollowing user:", error);
             setErrorMessage(error.response?.data?.error || "Failed to unfollow user.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, isAuthenticated, navigate]); // Add dependencies

    const handleViewProfile = useCallback((userId) => {
        navigate(`/profile/${userId}`);
    }, [navigate]); // Add dependency

    // Handler for Typeahead selection change
    const handleInterestSelectionChange = (selected) => {
        setSelectedInterests(selected);
        setCurrentPage(1);
        performSearch(searchQuery, universityFilter, selected, sortOrder, 1);
    };

    // Remove an interest from the selected interests
    const removeInterest = (interestToRemove) => {
        const newInterests = selectedInterests.filter(i => 
            typeof i === 'string' 
                ? i !== interestToRemove 
                : i.interest !== interestToRemove
        );
        setSelectedInterests(newInterests);
        setCurrentPage(1);
        performSearch(searchQuery, universityFilter, newInterests, sortOrder, 1);
    };

    // --- Render ---
    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">Discover Users</h2>

            {/* Alerts */}
            {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>{errorMessage}</Alert>}
            {successMessage && <Alert variant="success" onClose={() => setSuccessMessage("")} dismissible>{successMessage}</Alert>}


            {/* Search Panel */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                    <h4 className="mb-0">Search Users</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <input type="text" className="form-control" placeholder="Search by name or bio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search users"/>
                                    <button type="submit" className="btn btn-info"> <Search size={18} className="me-1" /> Search </button>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select" 
                                    value={universityFilter} 
                                    onChange={(e) => { setUniversityFilter(e.target.value); }} 
                                    aria-label="Filter by university"
                                >
                                    <option value="all">All Universities</option>
                                    {universities.map((uni) => (
                                        <option key={uni.id} value={uni.id}>{uni.university_name || uni.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Interest Filter */}
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <Typeahead
                                        id="interest-typeahead"
                                        multiple
                                        onInputChange={fetchInterestSuggestions}
                                        onChange={handleInterestSelectionChange}
                                        options={interestOptions}
                                        selected={selectedInterests}
                                        placeholder="Add interest filter..."
                                        labelKey="interest"
                                        allowNew={false}
                                    />
                                </div>
                                <small className="text-muted">Type an interest and select one from the dropdown</small>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select" 
                                    value={sortOrder} 
                                    onChange={(e) => { setSortOrder(e.target.value); }} 
                                    aria-label="Sort results"
                                >
                                    <option value="last_name">Last Name (A-Z)</option>
                                    <option value="-last_name">Last Name (Z-A)</option>
                                    <option value="first_name">First Name (A-Z)</option>
                                    <option value="-first_name">First Name (Z-A)</option>
                                    <option value="-date_joined">Newest Joined</option>
                                    <option value="date_joined">Oldest Joined</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>


     
            {/* User Recommendations Section === */}
            {isAuthenticated && (
                <div className="mb-4">
                    {/* Conditionally show heading */}
                    {!isUserRecLoading && (recommendedUsers.mutuals?.length > 0 || recommendedUsers.interest_based?.length > 0 || userRecError) && (
                         <h4 className="mb-3">Suggestions For You</h4>
                     )}

                    {isUserRecLoading && <div className="text-center my-4"><div className="spinner-border spinner-border-sm text-info" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                    {!isUserRecLoading && userRecError && ( <Alert variant="warning" className="py-2">{userRecError}</Alert> )}

                    {!isUserRecLoading && !userRecError && (
                        <>
                            {/* Mutual Followers Section */}
                            {recommendedUsers.mutuals?.length > 0 && (
                                <div className="mb-4">
                                    {/* Optional: Add sub-heading if showing both types */}
                                    {/* <h5 className="mb-3 text-muted">People You Might Know</h5> */}
                                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                                        {recommendedUsers.mutuals.map(recUser => (
                                            <div key={`rec-mutual-${recUser.id}`} className="col">
                                                <UserCard
                                                    userToDisplay={recUser}
                                                    onFollow={handleFollow}
                                                    onUnfollow={handleUnfollow}
                                                    onViewProfile={handleViewProfile}
                                                    currentUserId={user?.id}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interest-Based Section */}
                            {recommendedUsers.interest_based?.length > 0 && (
                                <div className="mb-4">
                                    {/* Optional: Add sub-heading if showing both types */}
                                    {/* <h5 className="mb-3 text-muted">Based on Your Interests</h5> */}
                                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                                        {recommendedUsers.interest_based.map(recUser => (
                                             <div key={`rec-interest-${recUser.id}`} className="col">
                                                <UserCard
                                                    userToDisplay={recUser}
                                                    onFollow={handleFollow}
                                                    onUnfollow={handleUnfollow}
                                                    onViewProfile={handleViewProfile}
                                                    currentUserId={user?.id}
                                                />
                                             </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                     {/* Message only if not loading, no error, AND both lists are empty */}
                    {!isUserRecLoading && !userRecError && recommendedUsers.mutuals?.length === 0 && recommendedUsers.interest_based?.length === 0 && (
                        <p className="text-muted text-center my-4">No user recommendations for you right now.</p>
                    )}
                </div>
            )}
            {/* === END User Recommendations Section === */}


            {/* Main Users Results Card */}
            <div className="card shadow-sm">
                 <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Users</h4>
                        {!isLoading && ( <span className="text-muted">{totalItems} user{totalItems !== 1 ? 's' : ''} found</span> )}
                    </div>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <div className="text-center p-5"> <div className="spinner-border text-info" role="status"> <span className="visually-hidden">Loading...</span> </div> </div>
                    ) : users.length > 0 ? (
                        <>
                            {/* Use UserCard for main results */}
                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                                {users.map((foundUser) => (
                                    <div key={foundUser.id} className="col">
                                        {/* Use the memoized UserCard component */}
                                        <UserCard
                                            userToDisplay={foundUser}
                                            onFollow={handleFollow}
                                            onUnfollow={handleUnfollow}
                                            onViewProfile={handleViewProfile}
                                            currentUserId={user?.id}
                                         />
                                    </div>
                                ))}
                            </div>

                             {/* Pagination Component */}
                             {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
                                </div>
                             )}
                        </>
                    ) : (
                        <div className="text-center p-5">
                            <p>No users found matching your search criteria.</p>
                             <p>Try adjusting your search terms or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverUsersPage;