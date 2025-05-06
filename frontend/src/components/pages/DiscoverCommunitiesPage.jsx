import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
// Import necessary icons from lucide-react
import { Lock, UserPlus, Search } from "lucide-react";
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { Alert } from 'react-bootstrap'; 

// --- Other imports if needed ---
const DiscoverCommunitiesPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const api = useApi();

    //User community membership state
    const [userCommunities, setUserCommunities] = useState([]);
    const [userRequestCommunities, setUserRequestCommunities] = useState([]);

    //Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [keywordOptions, setKeywordOptions] = useState([]);
    const [privacyFilter, setPrivacyFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("-id");

    //Results and UI state
    const [communities, setCommunities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // --->Recommendation State <---
    const [recommendedCommunities, setRecommendedCommunities] = useState([]);
    const [isRecLoading, setIsRecLoading] = useState(false); // Separate loading for recommendations
    const [recError, setRecError] = useState(''); // Separate error for recommendations

    //Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    //Fetch users joined and requested communities to check membership status
    const fetchUserMembershipData = async () => {
        // Added safety check
        if (!isAuthenticated) {
             setUserCommunities([]);
             setUserRequestCommunities([]);
             return;
        }
        try {
            // Original Promise.all kept
            const [membershipsResponse, requestsResponse] = await Promise.all([
                api.get(`api/communityfollow/followers/`),
                api.get(`api/communityfollow/follow_requests/`)
            ]);
            setUserCommunities(membershipsResponse.data);
            // Ensure requests are mapped correctly based on API response structure
            // This assumes the response is an array of objects where the community ID is request.community
            setUserRequestCommunities(requestsResponse.data.map(req => ({ id: req.community })) || []);
        } catch (error) {
            console.error("Error fetching user community data:", error);
            // Original had no error setting here, keeping it that way
        }
    };
    const fetchRecommendations = async () => {
        if (!isAuthenticated || !user || isRecLoading) return; // Check conditions

        setIsRecLoading(true);
        setRecError('');
        try {
            const response = await api.get('/api/recommendations/communities/', { params: { limit: 3 } });
            setRecommendedCommunities(response.data || []);
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            setRecError('Could not load recommendations at this time.');
            setRecommendedCommunities([]);
        } finally {
            setIsRecLoading(false);
        }
    };

    //On first render (Original Hook)
    useEffect(() => {
        // Fetch membership data only if authenticated
        if (isAuthenticated) {
            fetchUserMembershipData();
        }
        performSearch(selectedKeywords, 1); // Fetch initial search results on page 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Fetch membership when auth status changes, run initial search once


    //Update search when filter values change (Original Hook - modified dependencies slightly)
    useEffect(() => {
         if (currentPage > 0) { 
             performSearch(selectedKeywords, currentPage);
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [privacyFilter, sortOrder, currentPage]); // Run search when these change
    useEffect(() => {
        fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Keep dependency minimal


    //Check if user is a member of a community (Original Function)
    const isMemberOf = (communityId) => {
        // Added safety check for array
        return Array.isArray(userCommunities) && userCommunities.some(c => c.id === communityId);
    };

    //Check if user has requested to join a community (Original Function - corrected check based on fetch)
    const hasRequestedToJoin = (communityId) => {
        // Check the ID from the mapped structure in fetchUserMembershipData
        return Array.isArray(userRequestCommunities) && userRequestCommunities.some(c => c.id === communityId);
    };


    //Get membership status for a community (Original Function)
    const getMembershipStatus = (communityId) => {
        if (isMemberOf(communityId)) return "member";
        if (hasRequestedToJoin(communityId)) return "requested";
        return "none";
    };

    // Handle search form submission (Original Function - ensure page 1 search)
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1); // Reset to first page
        performSearch(selectedKeywords, 1); // Pass current keywords and page 1 explicitly
    };

    // Handle pagination change (Original Function)
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage); // State change triggers the search useEffect
    };


    // Fetch Keyword Suggestions (Original Function)
    const fetchKeywordSuggestions = async (inputValue) => {
        if (!inputValue) return; // Keep this guard

        try {
            const response = await api.get(`/api/keywords/suggestions/?query=${encodeURIComponent(inputValue)}`);
            
            setKeywordOptions(response.data || []); // Assume API returns array of objects {id: x, keyword: 'y'}
        } catch (error) {
            console.error("Error fetching keyword suggestions:", error);
             setKeywordOptions([]); // Clear on error
        }
    };

    //Perform the search API call (Original Function - adapted slightly)
    const performSearch = async (keywords = selectedKeywords, page = currentPage) => { // Accept keywords and page as args
        setIsLoading(true);
        setErrorMessage("");

        try {
            let params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            // Use the keywords passed into the function
            if (keywords && keywords.length > 0) params.append("keywords", keywords.join(","));
            if (privacyFilter !== "all") params.append("privacy", privacyFilter);
            params.append("ordering", sortOrder);
            params.append("page", page.toString()); // Use the page passed into the function

            const response = await api.get(`/api/communities/?${params.toString()}`);

            setCommunities(response.data.results || []);
            setTotalItems(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);

             // Handle page correction if current page becomes invalid
             if (response.data.total_pages && page > response.data.total_pages) {
                const lastPage = response.data.total_pages > 0 ? response.data.total_pages : 1;
                // Only update state if it's different, preventing potential loop if already on correct page
                if (currentPage !== lastPage) {
                    setCurrentPage(lastPage);
                }
            }
             // If called specifically with page 1 (e.g., new search), ensure state reflects it
             else if (page === 1 && currentPage !== 1) {
                 setCurrentPage(1);
             }


        } catch (error) {
            console.error("Error searching communities:", error);
            setErrorMessage("Failed to search communities. Please try again.");
            setCommunities([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };


    
    // Handler for Typeahead selection change
    const handleKeywordSelectionChange = (selected) => {
        
        const selectedKeywordStrings = selected.map(option =>
            typeof option === 'string' ? option : option.keyword 
        );
        setSelectedKeywords(selectedKeywordStrings); 
        setCurrentPage(1);
        performSearch(selectedKeywordStrings, 1); 
    };



    //Join a community (Original Function)
    const handleJoinCommunity = async (communityId) => {
         // Added auth check
         if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.post(`api/communityfollow/follow/`, { community_id: communityId });
            setSuccessMessage("Successfully joined the community.");
            setErrorMessage("");
            await fetchUserMembershipData(); // Refresh status
        } catch (error) {
            console.error("Error joining community:", error);
            setErrorMessage(error.response?.data?.error || "Failed to join community. Please try again.");
            setSuccessMessage("");
        }
    };

    //Request to join a private community (Original Function)
    const handleRequestToJoin = async (communityId) => {
         // Added auth check
         if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await api.post(`api/communityfollow/request_follow/`, { community_id: communityId });
            setSuccessMessage("Request to join the community sent.");
            setErrorMessage("");
            await fetchUserMembershipData(); // Refresh status
        } catch (error) {
            console.error("Error requesting to join community:", error);
            setErrorMessage(error.response?.data?.error || "Failed to request to join. Please try again.");
            setSuccessMessage("");
        }
    };

    //Navigate to a community page (Original Function)
    const handleViewCommunity = (communityId) => {
        navigate(`/communities/${communityId}`);
    };

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">Discover Communities</h2>

            {/* Alerts*/}
            {errorMessage && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {errorMessage}
                <button type="button" className="btn-close" onClick={() => setErrorMessage("")} aria-label="Close"></button>
             </div>}
            {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
                {successMessage}
                 <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} aria-label="Close"></button>
             </div>}

            {/* Search Panel  */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                    <h4 className="mb-0">Search Communities</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by community name or description"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        aria-label="Search communities"
                                    />
                                    <button type="submit" className="btn btn-primary">
                                        <Search size={18} className="me-1" /> Search
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    value={privacyFilter}
                                    onChange={(e) => { setPrivacyFilter(e.target.value); }} // Let useEffect handle search trigger
                                    aria-label="Filter by privacy"
                                >
                                    <option value="all">All Communities</option>
                                    <option value="public">Public Only</option>
                                    <option value="private">Private Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <Typeahead
                                        id="keyword-typeahead"
                                        multiple
                                        onInputChange={fetchKeywordSuggestions}
                                        onChange={handleKeywordSelectionChange} // Use specific handler
                                        options={keywordOptions}
                                        selected={selectedKeywords}
                                        placeholder="Add keyword filter..."
                                        allowNew={false} // Keep original
                                    />
                                </div>
                                <small className="text-muted">Type a keyword and select one from the dropdown</small>
                            </div>
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    value={sortOrder}
                                    onChange={(e) => { setSortOrder(e.target.value); }} // Let useEffect handle search trigger
                                    aria-label="Sort results"
                                >
                                    <option value="-id">Newest First</option>
                                    <option value="id">Oldest First</option>
                                    <option value="community_name">Name (A-Z)</option>
                                    <option value="-community_name">Name (Z-A)</option>
                                    <option value="-member_count">Most Members</option>
                                    <option value="member_count">Least Members</option>
                                </select>
                            </div>
                        </div>

                    </form>
                </div>
             {/* --- End Search Panel Card Div --- */}
            </div>


            {/* ===  Recommendations Section === */}
          
            {isAuthenticated && ( // Only show section if logged in
                 <div className="mb-4"> {/* Margin below recommendations */}
                     {/* Show heading only if not loading AND (there are items OR there was an error) */}
                     {!isRecLoading && (recommendedCommunities.length > 0 || recError) && (
                         <h4 className="mb-3">Recommended For You</h4>
                     )}

                     {/* Loading Indicator */}
                     {isRecLoading && (
                        <div className="text-center my-4"><div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading Recommendations...</span></div></div>
                     )}

                     {/* Error Message - Using standard div, replace with Alert if you prefer */}
                     {!isRecLoading && recError && <div className="alert alert-warning py-2">{recError}</div>}

                     {/* Recommendations Grid */}
                     {!isRecLoading && !recError && recommendedCommunities.length > 0 && (
                         <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"> {/* Grid layout */}
                             {recommendedCommunities.map(community => {
                                  // Logic to determine status for this specific card
                                  const membershipStatus = getMembershipStatus(community.id);
                                  // Get keywords (handle if field name is different, e.g., 'keywords' vs 'keyword_list')
                                  const keywords = community.keywords || community.keyword_list || [];

                                  return (
                                     <div key={`rec-${community.id}`} className="col"> {/* Unique key */}
                                         {/* Reusing same card structure as below for consistency */}
                                         <div className="card h-100 shadow-sm">
                                             <div className="card-header d-flex justify-content-between align-items-center">
                                                 <h5 className="mb-0 text-truncate" title={community.community_name}>
                                                     {community.community_name}
                                                 </h5>
                                                 <span className={`badge ${community.privacy === 'public' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                     {community.privacy}
                                                     {community.privacy === "private" && (<Lock size={14} className="ms-1" />)}
                                                 </span>
                                             </div>
                                             <div className="card-body">
                                                 <p className="card-text">
                                                     {community.description && community.description.length > 100
                                                         ? `${community.description.substring(0, 100)}...`
                                                         : community.description || "No description provided."}
                                                 </p>
                                                 <p className="card-text">
                                                     <small className="text-muted">
                                                         <strong>Members:</strong> {community.member_count || 0}
                                                     </small>
                                                 </p>
                                                 {keywords.length > 0 && (
                                                     <div className="mb-2">
                                                         <strong>Keywords:</strong>
                                                         <div className="d-flex flex-wrap gap-1 mt-1">
                                                             {keywords.map((keyword, index) => (
                                                                 <span key={index} className="badge bg-secondary">{keyword}</span>
                                                             ))}
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="card-footer bg-white">
                                                  {/* Reusing button logic from your existing results */}
                                                 <div className="d-flex gap-2">
                                                     <button
                                                         className="btn btn-info text-white flex-grow-1"
                                                         onClick={() => handleViewCommunity(community.id)}
                                                     >
                                                         View Community
                                                     </button>
                                                     {membershipStatus === "none" && (
                                                         community.privacy === "private" ? (
                                                             <button
                                                                 className="btn btn-outline-info"
                                                                 onClick={() => handleRequestToJoin(community.id)}
                                                             >
                                                                 Request <Lock size={14} className="ms-1" />
                                                             </button>
                                                         ) : (
                                                             <button
                                                                 className="btn btn-outline-success"
                                                                 onClick={() => handleJoinCommunity(community.id)}
                                                             >
                                                                 Join <UserPlus size={14} className="ms-1" />
                                                             </button>
                                                         )
                                                     )}
                                                     {membershipStatus === "requested" && ( <button className="btn btn-outline-secondary" disabled> Requested </button> )}
                                                     {membershipStatus === "member" && ( <button className="btn btn-outline-success" disabled> Member </button> )}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                  );
                             })}
                         </div>
                     )}
                                         {!isRecLoading && !recError && recommendedCommunities.length === 0 && (
                        <p className="text-muted text-center my-4">No community recommendations for you right now.</p>
                    )}
                 </div>
            )}
            {/* === END Recommendations Section === */}


            {/* Results Card (Original Structure) */}
            <div className="card shadow-sm">
                <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Communities</h4>
                        {!isLoading && (
                            <span className="text-muted">{totalItems} communities found</span>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : communities.length > 0 ? (
                        <>
                            <div className="row"> {/* Original row structure */}
                                {communities.map((community) => {
                                    const membershipStatus = getMembershipStatus(community.id);
                                    // Ensure keyword access matches serializer output
                                    const keywords = community.keywords || community.keyword_list || [];

                                    return (
                                        <div key={community.id} className="col-md-6 col-lg-4 mb-4">
                                            {/* Original Card Structure */}
                                            <div className="card h-100 shadow-sm">
                                                <div className="card-header d-flex justify-content-between align-items-center">
                                                    <h5 className="mb-0 text-truncate" title={community.community_name}>
                                                        {community.community_name}
                                                    </h5>
                                                    <span className={`badge ${community.privacy === 'public' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                        {community.privacy}
                                                        {community.privacy === "private" && (
                                                            <Lock size={14} className="ms-1" />
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="card-body">
                                                    <p className="card-text">
                                                        {community.description && community.description.length > 100
                                                            ? `${community.description.substring(0, 100)}...`
                                                            : community.description || "No description provided."}
                                                    </p>

                                                    <p className="card-text">
                                                        <small className="text-muted">
                                                            <strong>Members:</strong> {community.member_count || 0}
                                                        </small>
                                                    </p>

                                                    {keywords.length > 0 && ( // Use the keywords variable
                                                        <div className="mb-2">
                                                            <strong>Keywords:</strong>
                                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                                {keywords.map((keyword, index) => ( // Map over keywords
                                                                    <span key={index} className="badge bg-secondary">
                                                                        {keyword}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="card-footer bg-white">
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-info text-white flex-grow-1"
                                                            onClick={() => handleViewCommunity(community.id)}
                                                        >
                                                            View Community
                                                        </button>

                                                        {/* Original Buttons */}
                                                        {membershipStatus === "none" && (
                                                            community.privacy === "private" ? (
                                                                <button
                                                                    className="btn btn-outline-info"
                                                                    onClick={() => handleRequestToJoin(community.id)}
                                                                >
                                                                    Request <Lock size={14} className="ms-1" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => handleJoinCommunity(community.id)}
                                                                >
                                                                    Join <UserPlus size={14} className="ms-1" />
                                                                </button>
                                                            )
                                                        )}

                                                        {membershipStatus === "requested" && (
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                disabled
                                                            >
                                                                Requested
                                                            </button>
                                                        )}

                                                        {membershipStatus === "member" && (
                                                            <button
                                                                className="btn btn-outline-success"
                                                                disabled
                                                            >
                                                                Member
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/*Pagination Component (Original placement) */}
                            {totalPages > 1 && ( // Only show if more than one page
                                <div className="d-flex justify-content-center mt-4">
                                    <PaginationComponent
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        handlePageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        // No results message (Original Structure)
                        <div className="text-center p-5">
                            <p>No communities found matching your search criteria.</p>
                            <p>Try adjusting your search terms or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverCommunitiesPage;