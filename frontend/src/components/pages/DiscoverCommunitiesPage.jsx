import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react"; 
import { Lock, UserPlus, Search } from "lucide-react";
import useApi from "../../api"; 
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';


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

    //Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    //Fetch users joined and requested communities to check membership status
    const fetchUserMembershipData = async () => {
        try {
            const [membershipsResponse, requestsResponse] = await Promise.all([
                api.get(`api/communityfollow/followers/`),
                api.get(`api/communityfollow/follow_requests/`)
            ]);
            setUserCommunities(membershipsResponse.data);
            setUserRequestCommunities(requestsResponse.data);
        } catch (error) {
            console.error("Error fetching user community data:", error);
        }
    };

    //On first render
    useEffect(() => {
        fetchUserMembershipData();
        performSearch();
    }, []);

    //Update search when filter values change
    useEffect(() => {
        performSearch();
    }, [privacyFilter, sortOrder, currentPage]);

    //Check if user is a member of a community
    const isMemberOf = (communityId) => {
        return userCommunities.some(c => c.id === communityId);
    };

    //Check if user has requested to join a community
    const hasRequestedToJoin = (communityId) => {
        return userRequestCommunities.some(c => c.id === communityId);
    };

    //Get membership status for a community
    const getMembershipStatus = (communityId) => {
        if (isMemberOf(communityId)) return "member";
        if (hasRequestedToJoin(communityId)) return "requested";
        return "none";
    };
    
    // Handle search form submission
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        //Reset to first page when performing a new search
        setCurrentPage(1);
        performSearch();
    };

    // Handle pagination change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        //performSearch will be triggered by the useEffect
    };


    const fetchKeywordSuggestions = async (inputValue) => {
        if (!inputValue) return;
        
        try {
            const response = await api.get(`/api/keywords/suggestions/?query=${encodeURIComponent(inputValue)}`);
            setKeywordOptions(response.data || []);
        } catch (error) {
            console.error("Error fetching keyword suggestions:", error);
        }
    };


    //Perform the search API call
    const performSearch = async (optionalKeywords = null) => {
        setIsLoading(true);
        setErrorMessage("");
        
        try {
            let params = new URLSearchParams();
            
            if (searchQuery) {
                params.append("search", searchQuery);
            }
            
            //Use optionalKeywords if provided, otherwise use the state.
            //Used because adding keyword dynamically (setting state) doesnt update the state variable in time (although it should work!)
            //Quick fix for that
            const keywordsToUse = optionalKeywords !== null ? optionalKeywords : selectedKeywords; 
            
            if (keywordsToUse.length > 0) {
                params.append("keywords", keywordsToUse.join(","));
            }
            
            if (privacyFilter !== "all") {
                params.append("privacy", privacyFilter);
            }
            
            params.append("ordering", sortOrder);
            
            // Add pagination parameter
            params.append("page", currentPage.toString());
            
            const response = await api.get(`/api/communities/?${params.toString()}`);
            
            // Handle paginated response
            setCommunities(response.data.results || []);
            setTotalItems(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);
            
            //If current page doesn't exist anymore, go to the last page
            if (response.data.total_pages && currentPage > response.data.total_pages) {
                setCurrentPage(response.data.total_pages);
            }
        } catch (error) {
            console.error("Error searching communities:", error);
            setErrorMessage("Failed to search communities. Please try again.");
            setCommunities([]);
        } finally {
            setIsLoading(false);
        }
    };




    //Add a keyword to the selected keywords
    const addKeyword = (e) => {
        e.preventDefault();
        if (currentKeyword.trim() && !selectedKeywords.includes(currentKeyword.trim())) {
            const newKeywords = [...selectedKeywords, currentKeyword.trim()];
            setSelectedKeywords(newKeywords);
            setCurrentKeyword("");
            
            //Reset to page 1 when adding a new keyword
            setCurrentPage(1);
            performSearch(newKeywords);
        }
    };

    //On "Enter" add keyword
    const handleKeywordKeyDown = (e) => {
        if (e.key === 'Enter' && currentKeyword.trim()) {
            e.preventDefault();
            addKeyword(e);
        }
    };

    //Remove a keyword from the selected keywords
    const removeKeyword = (keyword) => {
        const newKeywords = selectedKeywords.filter(k => k !== keyword);
        setSelectedKeywords(newKeywords);
        
        //Reset to page 1 when removing a keyword
        setCurrentPage(1);
        performSearch(newKeywords);
    };

    //Join a community
    const handleJoinCommunity = async (communityId) => {
        try {
            const response = await api.post(`api/communityfollow/follow/`, { community_id: communityId });
            setSuccessMessage("Successfully joined the community.");
            setErrorMessage("");
            
            //Refresh user community data
            await fetchUserMembershipData();
        } catch (error) {
            console.error("Error joining community:", error);
            setErrorMessage("Failed to join community. Please try again.");
            setSuccessMessage("");
        }
    };

    //Request to join a private community
    const handleRequestToJoin = async (communityId) => {
        try {
            const response = await api.post(`api/communityfollow/request_follow/`, { community_id: communityId });
            setSuccessMessage("Request to join the community sent.");
            setErrorMessage("");
            
            //Refresh user community data
            await fetchUserMembershipData();
        } catch (error) {
            console.error("Error requesting to join community:", error);
            setErrorMessage("Failed to request to join the community. Please try again.");
            setSuccessMessage("");
        }
    };

    //Navigate to a community page
    const handleViewCommunity = (communityId) => {
        navigate(`/communities/${communityId}`);
    };

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">Discover Communities</h2>
            
            {/* Alerts */}
            {errorMessage && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {errorMessage}
                <button type="button" className="btn-close" onClick={() => setErrorMessage("")} aria-label="Close"></button>
             </div>}
            {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
                {successMessage}
                 <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} aria-label="Close"></button>
             </div>}

            {/* Search Panel */}
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
                                    onChange={(e) => {
                                        setPrivacyFilter(e.target.value);
                                        setCurrentPage(1); //Reset to page 1 when changing filters
                                    }}
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
                                        onChange={(selected) => {
                                            setSelectedKeywords(selected);
                                            setCurrentPage(1);
                                            performSearch(selected);
                                        }}
                                        options={keywordOptions}
                                        selected={selectedKeywords}
                                        placeholder="Add keyword filter..."
                                        allowNew={false}
                                    />

                                </div>
                                <small className="text-muted">Type a keyword and select one from the dropdown</small>
                            </div>
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value);
                                        setCurrentPage(1); //Reset to page 1 when changing sort order
                                    }}
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
                        
                        {/* Display selected keywords as tags */}
                        {selectedKeywords.length > 0 && (
                            <div className="mb-3">
                                <label className="form-label">Active Keyword Filters:</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {selectedKeywords.map((keyword) => (
                                        <span key={keyword} className="badge bg-info text-dark py-2 px-3">
                                            {keyword}
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white ms-2"
                                                onClick={() => removeKeyword(keyword)}
                                                aria-label={`Remove ${keyword} filter`}
                                                style={{ fontSize: '0.5rem' }}
                                            ></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Results */}
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
                            <div className="row">
                                {communities.map((community) => {
                                    const membershipStatus = getMembershipStatus(community.id);
                                    
                                    return (
                                        <div key={community.id} className="col-md-6 col-lg-4 mb-4">
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
                                                    
                                                    {community.keyword_list && community.keyword_list.length > 0 && (
                                                        <div className="mb-2">
                                                            <strong>Keywords:</strong>
                                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                                {community.keyword_list.map((keyword, index) => (
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
                                                        
                                                        {/* Show different buttons based on membership status */}
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
                            
                            {/*Pagination Component*/}
                            <div className="d-flex justify-content-center mt-4">
                                <PaginationComponent 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    handlePageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
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