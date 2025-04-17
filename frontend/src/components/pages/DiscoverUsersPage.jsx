import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { Search, UserPlus, UserX, Building } from "lucide-react";
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const DiscoverUsersPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth(); 
    const api = useApi();

    //Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [universityFilter, setUniversityFilter] = useState("all"); // 'all' or university ID
    const [sortOrder, setSortOrder] = useState("last_name"); 

    //Results state
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]); 

    //UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    //Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    //Fetch universities for the filter dropdown
    const fetchUniversities = async () => {
        try {
            const response = await api.get("api/universities/list/");
            setUniversities(response.data || []);
        } catch (error) {
            console.error("Error fetching universities:", error);
            setErrorMessage("Failed to fetch universities. Please try again.");
        }
    };

    //On first render
    useEffect(() => {
        fetchUniversities();
        performSearch();     
    }, []); 

    //Update search when filters or page change
    useEffect(() => {
        //Only call if currentPage > 1 OR if filters/sort change AFTER the initial load
         if (currentPage !== 1 || universityFilter !== "all" || sortOrder !== "last_name") {
             performSearch();
         }
    }, [universityFilter, sortOrder, currentPage]);

    //Handle search form submission
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1); 
        performSearch(true); 
    };

    //Handle pagination change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        //performSearch triggered by useEffect watching currentPage
    };

    //Perform the user search API call
    const performSearch = async (isNewSearch = false) => {
        setIsLoading(true);
        setErrorMessage("");
        if (isNewSearch) setSuccessMessage(""); 

        try {
            let params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (universityFilter !== "all") params.append("university", universityFilter);
            params.append("ordering", sortOrder);
            params.append("page", currentPage.toString());

            const response = await api.get(`/api/users/?${params.toString()}`); 

            // Handle paginated response
            setUsers(response.data.results || []);
            setTotalItems(response.data.count || 0);
            const calculatedTotalPages = response.data.total_pages; 
            setTotalPages(calculatedTotalPages);

            //Handle case where current page becomes invalid after filtering
            if (calculatedTotalPages > 0 && currentPage > calculatedTotalPages) {
                 setCurrentPage(calculatedTotalPages);
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

    // --- Follow/Unfollow Actions ---
    const handleFollow = async (userIdToFollow) => {
        setSuccessMessage("");
        setErrorMessage("");
        try {
            await api.post('api/follow/follow/', { user_id: userIdToFollow });
            setSuccessMessage("User followed successfully.");
            //Update the specific users state locally for immediate feedback
            setUsers(currentUsers => currentUsers.map(u =>
                u.id === userIdToFollow ? { ...u, is_following: true } : u
            ));
        } catch (error) {
            console.error("Error following user:", error);
            setErrorMessage(error.response?.data?.error || "Failed to follow user.");
        }
    };

    const handleUnfollow = async (userIdToUnfollow) => {
         setSuccessMessage("");
         setErrorMessage("");
        try {
            await api.delete(`api/follow/unfollow/?user_id=${userIdToUnfollow}`);
            setSuccessMessage("User unfollowed successfully.");
            //Update the specific users state locally for immediate feedback
            setUsers(currentUsers => currentUsers.map(u =>
                u.id === userIdToUnfollow ? { ...u, is_following: false } : u
            ));
        } catch (error) {
            console.error("Error unfollowing user:", error);
             setErrorMessage(error.response?.data?.error || "Failed to unfollow user.");
        }
    };

     //Navigate to user profile
    const handleViewProfile = (userId) => {
        navigate(`/profile/${userId}`); 
    };


    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">Discover Users</h2>

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
                <div className="card-header bg-info text-white"> {/* Changed color */}
                    <h4 className="mb-0">Search Users</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <div className="row mb-3">
                            {/* Search Input */}
                            <div className="col-md-8">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name or bio..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        aria-label="Search users"
                                    />
                                    <button type="submit" className="btn btn-info"> 
                                        <Search size={18} className="me-1" /> Search
                                    </button>
                                </div>
                            </div>
                             {/* University Filter */}
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    value={universityFilter}
                                    onChange={(e) => {
                                        setUniversityFilter(e.target.value);
                                        setCurrentPage(1); 
                                    }}
                                    aria-label="Filter by university"
                                >
                                    <option value="all">All Universities</option>
                                    {universities.map((uni) => (
                                        <option key={uni.id} value={uni.id}>{uni.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row mb-3">
                             {/* Sort Order */}
                            <div className="col-md-4 offset-md-8"> 
                                <select
                                    className="form-select"
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value);
                                        setCurrentPage(1); 
                                    }}
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

            {/* Results */}
            <div className="card shadow-sm">
                 <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Users</h4>
                        {!isLoading && (
                            <span className="text-muted">{totalItems} user{totalItems !== 1 ? 's' : ''} found</span>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-info" role="status"> 
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : users.length > 0 ? (
                        <>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {users.map((foundUser) => (
                                    <div key={foundUser.id} className="col">
                                        <div className="card h-100 shadow-sm">
                                             <div className="card-body text-center">
                                                <img
                                                    src={foundUser.profile_picture_url || default_profile_picture}
                                                    alt={`${foundUser.first_name} ${foundUser.last_name}`}
                                                    className="rounded-circle mb-3"
                                                    width="100"
                                                    height="100"
                                                    style={{ objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        if (e.target.src !== default_profile_picture) {
                                                            e.target.onerror = null;
                                                            e.target.src = default_profile_picture;
                                                        }
                                                    }}
                                                />
                                                <h5 className="card-title">
                                                    {foundUser.first_name} {foundUser.last_name}
                                                </h5>
                                                {foundUser.university && (
                                                    <p className="card-text text-muted small">
                                                        <Building size={14} className="me-1" />
                                                        {foundUser.university.university_name}
                                                    </p>
                                                )}
                                                <p className="card-text" style={{ minHeight: '40px' }}> 
                                                    <small>{foundUser.bio?.substring(0, 80)}{foundUser.bio?.length > 80 ? '...' : ''}</small>
                                                </p>
                                            </div>
                                            <div className="card-footer bg-white d-flex justify-content-around align-items-center">
                                                 <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handleViewProfile(foundUser.id)}
                                                    >
                                                    View Profile
                                                </button>
                                                {/* Follow/Unfollow Button */}
                                                {foundUser.is_following ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleUnfollow(foundUser.id)}
                                                    >
                                                        <UserX size={16} className="me-1"/> Unfollow
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => handleFollow(foundUser.id)}
                                                    >
                                                       <UserPlus size={16} className="me-1"/> Follow
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                             {/* Pagination Component */}
                             {totalPages > 1 && (
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