import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
// Import Alert component from react-bootstrap if you intend to use it
import { Alert } from 'react-bootstrap';
// Import necessary icons from lucide-react
import { Lock, UserPlus, Search, UserX, Building } from "lucide-react"; // Removed unused Lock, added Alert as BsAlert if using lucide one
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
// Removed Typeahead imports as they are not used in this file
// import { Typeahead } from 'react-bootstrap-typeahead';
// import 'react-bootstrap-typeahead/css/Typeahead.css';
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const DiscoverUsersPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const api = useApi();

    //Search state (Original)
    const [searchQuery, setSearchQuery] = useState("");
    const [universityFilter, setUniversityFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("last_name");

    //Results state (Original)
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]);

    //UI state (Original)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // ---> User Recommendation State <---
    const [recommendedUsers, setRecommendedUsers] = useState({ mutuals: [], interest_based: [] });
    const [isUserRecLoading, setIsUserRecLoading] = useState(false);
    const [userRecError, setUserRecError] = useState('');
    // ---> END User Recommendation State <---

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
            setErrorMessage("Failed to fetch universities list.");
        }
    };

    // Fetch User Recommendations Function
    // --- fetchUserRecommendations Function ---
    const fetchUserRecommendations = async () => {
        // Added checks here as well for safety, although useEffect also checks
        if (!isAuthenticated || !user || isUserRecLoading) return;

        console.log("Attempting to fetch user recommendations..."); // Debug log

        setIsUserRecLoading(true);
        setUserRecError('');
        try {
            const response = await api.get('/api/recommendations/users/', { params: { limit: 6 } });

            // --- Debugging Logs ---
            console.log("API Response for User Recs:", response.data);
            const recData = {
                 mutuals: response.data?.mutuals || [],
                 interest_based: response.data?.interest_based || []
             };
            console.log("Setting Recommended Users State to:", recData);
             // --- End Debugging Logs ---

            setRecommendedUsers(recData);

        } catch (err) {
            console.error("Error fetching user recommendations:", err);
            setUserRecError('Could not load user recommendations.');
            setRecommendedUsers({ mutuals: [], interest_based: [] }); // Reset state on error
        } finally {
            setIsUserRecLoading(false);
        }
    };
    // --- END fetchUserRecommendations Function ---

    //Perform the user search API call (Original Function - takes args)
    const performSearch = async (query = searchQuery, uni = universityFilter, sort = sortOrder, page = currentPage) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            let params = new URLSearchParams();
            if (query) params.append("search", query);
            if (uni !== "all") params.append("university", uni);
            params.append("ordering", sort);
            params.append("page", page.toString());

            const response = await api.get(`/api/users/?${params.toString()}`);

            setUsers(response.data.results || []);
            setTotalItems(response.data.count || 0);
            const calculatedTotalPages = response.data.total_pages || 1;
            setTotalPages(calculatedTotalPages);

             // Handle page correction
             if (calculatedTotalPages > 0 && page > calculatedTotalPages) {
                 if (currentPage !== calculatedTotalPages) {
                     setCurrentPage(calculatedTotalPages);
                 }
             } else if (page === 1 && currentPage !== 1) {
                 setCurrentPage(1);
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
    };


    // --- useEffect Hooks ---

    // Initial data load
    useEffect(() => {
        fetchUniversities();
        performSearch(searchQuery, universityFilter, sortOrder, 1); // Initial search on page 1
        if (isAuthenticated) {
            fetchUserRecommendations(); // Fetch recommendations on initial load if authenticated
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Rerun everything if auth status changes

    // Search when filters/page change (but not initial load)
    useEffect(() => {
        // Flag to prevent running on initial mount if needed (complex state interaction)
        const isInitialMount = currentPage === 1 && universityFilter === 'all' && sortOrder === 'last_name'; // Example, might need refinement
        if (!isInitialMount) { // Only run if filters/page actually changed *after* mount
             performSearch(searchQuery, universityFilter, sortOrder, currentPage);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [universityFilter, sortOrder, currentPage]); // Dependencies that trigger re-search


    // --- Action Handlers ---

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (currentPage === 1) {
            // If already on page 1, changing search query needs to trigger search directly
            performSearch(searchQuery, universityFilter, sortOrder, 1);
        } else {
            // If on other pages, resetting to page 1 will trigger the useEffect
            setCurrentPage(1);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage); // State change triggers useEffect
    };

    const handleFollow = async (userIdToFollow) => {
        setSuccessMessage(""); setErrorMessage("");
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.post('api/follow/follow/', { user_id: userIdToFollow });
            setSuccessMessage("User followed successfully.");
            // Optimistically update UI for both main list and recommendations
            const updateUserState = (u) => u.id === userIdToFollow ? { ...u, is_following: true } : u;
            setUsers(currentUsers => currentUsers.map(updateUserState));
            setRecommendedUsers(prevRecs => ({
                 mutuals: prevRecs.mutuals.filter(u => u.id !== userIdToFollow), // Remove if followed
                 interest_based: prevRecs.interest_based.filter(u => u.id !== userIdToFollow)
             }));
            // Consider refetching recommendations after follow?
            // fetchUserRecommendations();
        } catch (error) {
            console.error("Error following user:", error);
            setErrorMessage(error.response?.data?.error || "Failed to follow user.");
        }
    };

    const handleUnfollow = async (userIdToUnfollow) => {
         setSuccessMessage(""); setErrorMessage("");
         if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.delete(`api/follow/unfollow/?user_id=${userIdToUnfollow}`);
            setSuccessMessage("User unfollowed successfully.");
             // Optimistically update UI
             const updateUserState = (u) => u.id === userIdToUnfollow ? { ...u, is_following: false } : u;
             setUsers(currentUsers => currentUsers.map(updateUserState));
             // No need to update recommendations typically, as unfollowed user shouldn't be there
        } catch (error) {
            console.error("Error unfollowing user:", error);
             setErrorMessage(error.response?.data?.error || "Failed to unfollow user.");
        }
    };

    const handleViewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // --- Helper Component for User Card (Recommended) ---
    const UserCard = ({ userToDisplay, onFollow, onUnfollow, onViewProfile, currentUserId }) => {
        const isCurrentUser = userToDisplay.id === currentUserId;
        return (
            <div className="card h-100 shadow-sm">
                <div className="card-body text-center d-flex flex-column">
                    <img
                        src={userToDisplay.profile_picture_url || default_profile_picture}
                        alt={`${userToDisplay.first_name} ${userToDisplay.last_name}`}
                        className="rounded-circle mb-2 align-self-center"
                        width="70" height="70"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = default_profile_picture; }}
                    />
                    <h5 className="card-title h6 text-truncate" title={`${userToDisplay.first_name} ${userToDisplay.last_name}`}>
                        {userToDisplay.first_name} {userToDisplay.last_name}
                    </h5>
                    {userToDisplay.university && (
                        <p className="card-text text-muted small mb-2 text-truncate">
                            <Building size={12} className="me-1" />
                            {userToDisplay.university?.university_name || userToDisplay.university?.name}
                        </p>
                    )}
                    {/* Display Bio if available in main search results */}
                     {userToDisplay.bio && (
                        <p className="card-text small" style={{ minHeight: '30px', overflow: 'hidden' }}> {/* Added style */}
                            {userToDisplay.bio.substring(0, 50)}{userToDisplay.bio.length > 50 ? '...' : ''}
                         </p>
                    )}
                    {/* Optional: Display mutual count */}
                    {/* {userToDisplay.mutual_follows && <small className="text-muted d-block mb-2">{userToDisplay.mutual_follows} mutual</small>} */}

                    <div className="mt-auto d-flex justify-content-around pt-2">
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
    };


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
                                <select className="form-select" value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)} aria-label="Filter by university">
                                    <option value="all">All Universities</option>
                                    {universities.map((uni) => ( <option key={uni.id} value={uni.id}>{uni.university_name || uni.name}</option> ))}
                                </select>
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-4 offset-md-8">
                                <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort results">
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

            {/* ============================================================ */}
            {/* === User Recommendations Section === */}
            {/* ============================================================ */}
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
                                    {/* Removed sub-heading to combine */}
                                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                                        {recommendedUsers.mutuals.map(recUser => (
                                            <div key={`rec-mutual-${recUser.id}`} className="col">
                                                <UserCard
                                                    userToDisplay={recUser}
                                                    onFollow={handleFollow}
                                                    onUnfollow={handleUnfollow} // Pass unfollow handler
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
                                    {/* Removed sub-heading */}
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
            {/* ============================================================ */}
            {/* === END User Recommendations Section === */}
            {/* ============================================================ */}


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
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {users.map((foundUser) => (
                                    <div key={foundUser.id} className="col">
                                         {/* Use the UserCard component for main results too */}
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