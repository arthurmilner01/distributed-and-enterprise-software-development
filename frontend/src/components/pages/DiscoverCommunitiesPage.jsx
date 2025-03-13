import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react"; 
import { Lock, UserPlus } from "lucide-react";
import useApi from "../../api"; 
import { useParams } from "react-router-dom";

const DiscoverCommunitiesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const api = useApi();
  const [communities, setCommunities] = useState([]);
  // State to prevent communities the user is a member of from showing
  const [userCommunities, setUserCommunities] = useState([]);
  const [relevantCommunities, setRelevantCommunities] = useState([]);
  const [userRequestCommunities, setUserRequestCommunities] = useState([]);

    // Fetch user's communities from the API
    const fetchUserCommunities = async () => {
        try {
        const response = await api.get(`api/communityfollow/followers/`);
        setUserCommunities(response.data);
        } catch (error) {
        console.error("Error fetching user communities:", error);
        setErrorMessage("Failed to load user communities.");
        }
    };

    // Fetch all communities
    const fetchCommunities = async () => {
        try {
        const response = await api.get("api/communityfollow/communities_all/");
        setCommunities(response.data);
        } catch (error) {
        console.error("Error fetching communities:", error);
        setErrorMessage("Failed to load communities.");
        }
    };

    // Fetch users outgoing community requests
    const fetchUserCommunityRequests = async () => {
        try {
            const response = await api.get("api/communityfollow/follow_requests/");
            setUserRequestCommunities(response.data);
        } catch (error) {
            console.error("Error fetching communities:", error);
            setErrorMessage("Failed to load communities.");
        }
    }

    // Filters the communities by removing those the user is already a member of or has requested
    const getRelevantCommunities = async () => {
        try {
            const response = await api.get("api/communityfollow/relevant_communities/");
            setRelevantCommunities(response.data);
        } catch (error) {
            console.error("Error fetching communities:", error);
            setErrorMessage("Failed to load communities.");
        }
    };
  

    // Get updated user details
    useEffect(() => {
        fetchUserCommunities();
        fetchCommunities();
        fetchUserCommunityRequests();
    }, []);

    // Filters
    useEffect(() => {
        getRelevantCommunities();
    }, [communities, userCommunities, userRequestCommunities]);

  const handleFollowCommunity = async (communityId) => {
    try {
        const response = await api.post(`api/communityfollow/follow/`, { community_id: communityId });
        fetchUserCommunities();
        fetchCommunities();
        fetchUserCommunityRequests();
        setSuccessMessage("Community joined.");
        setErrorMessage("");
    } catch (error) {
        console.error("Error joining community:", error);
        setErrorMessage("Failed to join community. Please try again.");
        setSuccessMessage("");
    }
  };

  const handleRequestToFollow = async (communityId) => {
    try {
        const response = await api.post(`api/communityfollow/request_follow/`, { community_id: communityId });
        fetchUserCommunities();
        fetchCommunities();
        fetchUserCommunityRequests();
        setSuccessMessage("Request to join the community sent.");
        setErrorMessage("");
    } catch (error) {
        console.error("Error joining community:", error);
        setErrorMessage("Failed to request to join the community. Please try again.");
        setSuccessMessage("");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Discover New Communities</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Displaying the relevant communities */}
      <div className="list-group">
        {relevantCommunities.length > 0 ? (
          relevantCommunities.map((community) => (
            <div key={community.id} className="list-group-item">
                <h4>{community.community_name}
                {community.privacy === "private" && (
                  <Lock size={18} style={{ marginLeft: '10px' }} />
                )}
                </h4>
                <p>{community.description}</p>
                <p><strong>Rules:</strong> {community.rules}</p>
                {community.privacy === "private" ? (
                <button className="btn btn-info text-white" onClick={() => handleRequestToFollow(community.id)}>
                    Request to Join <Lock size={18} style={{ marginLeft: '8px' }} />
                </button>
                ) : (
                <button className="btn btn-info text-white" onClick={() => handleFollowCommunity(community.id)}>
                    Join <UserPlus size={18} style={{ marginLeft: '8px' }} />
                </button>
                )}
            </div>
          ))
        ) : (
          <p>No relevant communities to display.</p>
        )}
      </div>
    </div>
  );
};

export default DiscoverCommunitiesPage;
