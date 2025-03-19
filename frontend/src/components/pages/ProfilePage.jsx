import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react"; 
import { Edit, Check, X, UserPlus, UserCheck } from "lucide-react";
import { Modal } from "react-bootstrap";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api"; 
import { useParams } from "react-router-dom";

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { userId } = useParams(); // Get userId from URL
  const isOwner = user.id === parseInt(userId);
  const [currentTab, setCurrentTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const api = useApi();
  const [fetchedUser, setFetchedUser] = useState(null);
  const [editableUser, setEditableUser] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    interests: "",
    profile_picture: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState([]);
  const [followerList, setFollowerList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const handleShowFollowers = () => setShowFollowersModal(true);
  const handleCloseFollowers = () => setShowFollowersModal(false);
  const handleShowFollowing = () => setShowFollowingModal(true);
  const handleCloseFollowing = () => setShowFollowingModal(false);


  // User Posts
  const [userPosts, setUserPosts] = useState([]);

  const fetchUserPosts = async () => {
    try {
      const response = await api.get(`api/posts/?user=${userId}`);
      setUserPosts(response.data);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };
  // Fetch posts when the "Posts" tab is active
useEffect(() => {
  if (currentTab === "posts" && userId) {
    fetchUserPosts();
  }
}, [currentTab, userId]);

  // NEW: State for user's communities (and roles)
  const [userCommunities, setUserCommunities] = useState([]);

  // Fetch user's communities from the API
  const fetchUserCommunities = async () => {
    try {
      const response = await api.get(`api/communityfollow/user_communities_list/?user_id=${userId}`);
      setUserCommunities(response.data);
    } catch (error) {
      console.error("Error fetching user communities:", error);
      setErrorMessage("Failed to load user communities.");
    }
  };

  // Get viewed user's followers
  const fetchFollowers = async (userId) => {
    try {
      const response = await api.get(`api/follow/followers/?user_id=${userId}`);
      setFollowerList(response.data);
      setFollowerCount(response.data.length);
    } catch (error) {
      console.error("Error fetching followers:", error);
      setErrorMessage("Failed to load followers.");
    }
  };

  // Get viewed user's following
  const fetchFollowing = async (userId) => {
    try {
      const response = await api.get(`api/follow/following/?user_id=${userId}`);
      setFollowingList(response.data);
      setFollowingCount(response.data.length);
    } catch (error) {
      console.error("Error fetching following:", error);
      setErrorMessage("Failed to load following.");
    }
  };

  const checkFollowing = async (userId) => {
    try {
      const response = await api.get(`api/follow/check_following/?user_id=${userId}`);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error("Error checking follow status:", error);
      setErrorMessage("Failed to check follow status.");
    }
  };

  // Fetch user details from the API using ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`user/${userId}/`);
        setFetchedUser(response.data);
        setEditableUser({
          id: response.data.id,
          first_name: response.data.first_name || "Unknown",
          last_name: response.data.last_name || "Unknown",
          bio: response.data.bio || "This user hasn't added a bio...",
          interests: response.data.interests || "This user hasn't added any interests...",
          profile_picture: response.data.profile_picture || default_profile_picture
        });
        fetchFollowers(response.data.id);
        fetchFollowing(response.data.id);
        checkFollowing(response.data.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response && error.response.data && error.response.data.error) {
          setErrorMessage(error.response.data.error);
        } else {
          setErrorMessage("Failed to load user data.");
        }
      }
    };
    if (userId) {
      setErrorMessage("");
      if (!isEditing || isConfirmed) {
        fetchUserData();
        if (isConfirmed) {
          setIsConfirmed(false);
        }
      }
    }
  }, [userId, isConfirmed]);

  // NEW: Fetch communities when "communities" tab is active
  useEffect(() => {
    if (currentTab === "communities") {
      fetchUserCommunities();
    }
  }, [currentTab, userId]);

  if (!fetchedUser) {
    return (
      <div>
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      </div>
    );
  }
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      setEditableUser({ ...editableUser, profile_picture: file });
  
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableUser((prevUser) => ({
          ...prevUser,
          profile_picture: reader.result, // Update UI preview
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle profile editing inputs
  const handleInputChange = (e) => {
    setEditableUser({ ...editableUser, [e.target.name]: e.target.value });
  };
  const handleSaveChanges = async () => {
    const updatedUser = new FormData();
  
    if (editableUser.first_name !== fetchedUser.first_name && editableUser.first_name !== "Unknown") {
      updatedUser.append('first_name', editableUser.first_name);
    }
    if (editableUser.last_name !== fetchedUser.last_name && editableUser.last_name !== "Unknown") {
      updatedUser.append('last_name', editableUser.last_name);
    }
    if (editableUser.bio !== fetchedUser.bio && editableUser.bio !== "This user hasn't added a bio...") {
      updatedUser.append('bio', editableUser.bio);
    }
    if (editableUser.interests !== fetchedUser.interests && editableUser.interests !== "This user hasn't added any interests...") {
      updatedUser.append('interests', editableUser.interests);
    }
  
    // ✅ Ensure profile_picture is being added properly
    if (editableUser.profile_picture && editableUser.profile_picture !== fetchedUser.profile_picture) {
      if (editableUser.profile_picture instanceof File) {
        updatedUser.append('profile_picture', editableUser.profile_picture);
      }
    }
  
    // 🔥 Debugging: Check if the file is included
    for (let pair of updatedUser.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }
  
    try {
      const response = await api.patch(`user/update/${userId}/`, updatedUser, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      console.log("Profile update response:", response.data);
      setErrorMessage("");
      setSuccessMessage("Profile successfully updated.");
      setIsEditing(false);
      setIsConfirmed(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setSuccessMessage("");
    }
  };
  

  const handleCancel = () => {
    setEditableUser({
      first_name: fetchedUser.first_name || "Unknown",
      last_name: fetchedUser.last_name || "Unknown",
      bio: fetchedUser.bio || "This user hasn't added a bio...",
      interests: fetchedUser.interests || "This user hasn't added any interests...",
      profile_picture: fetchedUser.profile_picture || default_profile_picture,
    });
    setIsEditing(false);
    setSuccessMessage("");
    setErrorMessage("Profile update cancelled.");
  };

  const handleUnfollow = async () => {
    try {
      const response = await api.delete(`api/follow/unfollow/?user_id=${userId}`);
      fetchFollowers(userId);
      fetchFollowing(userId);
      checkFollowing(userId);
      setSuccessMessage("User unfollowed.");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to unfollow user. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleFollow = async () => {
    try {
      const response = await api.post(`api/follow/follow/`, { user_id: userId });
      fetchFollowers(userId);
      fetchFollowing(userId);
      checkFollowing(userId);
      setSuccessMessage("User followed.");
      setErrorMessage("");
    } catch (error) {
      console.error("Error following user:", error);
      setErrorMessage("Failed to follow user. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleModalUnfollow = async (followerId) => {
    try {
      const response = await api.delete(`api/follow/unfollow/?user_id=${followerId}`);
      fetchFollowers(userId);
      fetchFollowing(userId);
      checkFollowing(userId);
      setSuccessMessage("User unfollowed.");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to unfollow user. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleModalFollow = async (followerId) => {
    try {
      const response = await api.post(`api/follow/follow/`, { user_id: followerId });
      fetchFollowers(userId);
      fetchFollowing(userId);
      checkFollowing(userId);
      setSuccessMessage("User followed.");
      setErrorMessage("");
    } catch (error) {
      console.error("Error following user:", error);
      setErrorMessage("Failed to follow user. Please try again.");
      setSuccessMessage("");
    }
  };


  return (
    <div className="container mt-5">
      <div className="row">
      <div className="col-md-3 text-center">
      <img
  src={editableUser.profile_picture_preview || editableUser.profile_picture || default_profile_picture}
  alt="Profile"
  className="img-fluid rounded-circle border border-3 text-info"
  style={{ width: "200px", height: "200px" }}
/>


  {isEditing && (
    <div className="mt-2">
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      setEditableUser({ ...editableUser, profile_picture: file, profile_picture_preview: imageUrl });
    }
  }}
/>

    </div>
  )}
</div>


        <div className="col-md-9">
          <div className="d-flex flex-column justify-content-center">
            <h2 className="mt-4">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="first_name"
                    value={editableUser.first_name}
                    onChange={handleInputChange}
                    className="form-control d-inline w-auto"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editableUser.last_name}
                    onChange={handleInputChange}
                    className="form-control d-inline w-auto ms-2"
                  />
                </>
              ) : (
                <>
                  {fetchedUser.first_name || "Unknown"} {fetchedUser.last_name || "Unknown"}
                </>
              )}
              
              {isOwner && !isEditing && (
                <button className="btn text-info p-0 ms-2" onClick={() => setIsEditing(true)}>
                  <Edit size={25} />
                </button>
              )}
            </h2>

            <p className="text-muted">{fetchedUser.email || "Unknown"}</p>
            <div className="d-flex gap-1">
              <p className="text-muted">Followers: </p>
              <p className="text-primary" style={{ cursor: "pointer", textDecoration: "underline"}} onClick={handleShowFollowers}>
                {followerCount}
              </p>
              <p className="text-muted">Following: </p>
              <p className="text-primary" style={{ cursor: "pointer", textDecoration: "underline" }} onClick={handleShowFollowing}>
                {followingCount}
              </p>
            </div>
            {!isOwner && (
              <div className="d-flex mt-3">
                {isFollowing ? (
                  <button className="btn btn-danger" onClick={handleUnfollow}>
                    <UserCheck size={20} /> Unfollow
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleFollow}>
                    <UserPlus size={20} /> Follow
                  </button>
                )}
              </div>
            )}
            <hr />

            <div className="mb-3">
              <h4>Bio</h4>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editableUser.bio}
                  onChange={handleInputChange}
                  className="form-control"
                />
              ) : (
                <p>{fetchedUser.bio || "User has not provided a bio..."}</p>
              )}
            </div>

            <div className="mb-3">
              <h4>Interests</h4>
              {isEditing ? (
                <textarea
                  name="interests"
                  value={editableUser.interests}
                  onChange={handleInputChange}
                  className="form-control"
                />
              ) : (
                <p>{fetchedUser.interests || "User hasn't provided any interests..."}</p>
              )}
            </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}
            {successMessage && <p className="text-success">{successMessage}</p>}

            {isOwner && isEditing && (
              <div className="d-flex gap-2 mt-2 mb-3">
                <button className="btn btn-success" onClick={handleSaveChanges}>
                  <Check size={20} /> Confirm
                </button>
                <button className="btn btn-danger" onClick={handleCancel}>
                  <X size={20} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="nav nav-pills mb-3 d-flex justify-content-center" id="profile-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("posts")}
          >
            Posts
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "communities" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("communities")}
          >
            Communities
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "events" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("events")}
          >
            Events
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
      {currentTab === "posts" && (
      <div className="tab-pane fade show active">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">User Posts</h5>
            {userPosts.length > 0 ? (
              <ul className="list-group">
                {userPosts.map((post) => (
                  <li key={post.id} className="list-group-item d-flex align-items-start">
                    {/* Profile Image */}
                    <img
                      src={post.user_image || default_profile_picture}
                      alt="User Avatar"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginRight: "15px",
                        border: "2px solid #ddd",
                      }}
                    />
                    {/* Post Content */}
                    <div style={{ flex: 1 }}>
                      <h5>{post.user_name} {post.user_last_name}</h5>
                      <p>{post.post_text}</p>
                      <small>{new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                    {/* Likes Button */}
                    <button
                      className="btn btn-outline-danger"
                      style={{ marginLeft: "auto" }}
                    >
                      ❤️ {post.likes}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts yet.</p>
            )}
          </div>
        </div>
      </div>
    )}


        {currentTab === "communities" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">User Communities</h5>
                {userCommunities.length > 0 ? (
                  <ul>
                    {userCommunities.map((uc) => (
                      <li key={uc.id}>
                        {uc.community_name} — <strong>{uc.role}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No communities found.</p>
                )}
                {errorMessage && <p className="text-danger">{errorMessage}</p>}
              </div>
            </div>
          </div>
        )}

        {currentTab === "events" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Upcoming Events</h5>
                <p className="card-text">Upcoming events here...</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal show={showFollowersModal} onHide={handleCloseFollowers}>
      <Modal.Header closeButton>
        <Modal.Title>Followers</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {followerList.length > 0 ? (
          <ul className="list-group">
            {followerList.map((follower) => (
              <li key={follower.id} className="list-group-item d-flex align-items-center justify-content-between">
                <img
                  src={follower.profile_picture || default_profile_picture}
                  alt="Profile"
                  className="rounded-circle me-2"
                  style={{ width: "50px", height: "50px", margin:"10px" }}
                />
                {follower.first_name || "Unknown"} {follower.last_name || "Unknown"}
                {follower.id !== user.id && 
                  (follower.is_following ? (
                    <button className="btn btn-danger" onClick={() => handleModalUnfollow(follower.id)}>
                      <UserCheck size={20} /> Unfollow
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => handleModalFollow(follower.id)}>
                      <UserPlus size={20} /> Follow
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No followers yet.</p>
        )}
      </Modal.Body>
      </Modal>

      <Modal show={showFollowingModal} onHide={handleCloseFollowing}>
      <Modal.Header closeButton>
        <Modal.Title>Following</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {followingList.length > 0 ? (
          <ul className="list-group">
            {followingList.map((following) => (
              <li key={following.id} className="list-group-item d-flex align-items-center justify-content-between">
                <img
                  src={following.profile_picture || default_profile_picture}
                  alt="Following Profile Picture"
                  className="rounded-circle"
                  style={{ width: "50px", height: "50px", margin:"10px" }}
                />
                {following.first_name || "Unknown"} {following.last_name || "Unknown"}
                {following.id !== user.id && 
                  (following.is_following ? (
                    <button className="btn btn-danger" onClick={() => handleModalUnfollow(following.id)}>
                      <UserCheck size={20} /> Unfollow
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => handleModalFollow(following.id)}>
                      <UserPlus size={20} /> Follow
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Not following any users.</p>
        )}
      </Modal.Body>
      </Modal>

    </div>
  );
};

export default ProfilePage;
