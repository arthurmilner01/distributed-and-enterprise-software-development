import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react"; 
import { Edit, Check, X, Users, UserPlus, UserCheck, FileText, MessageCircle, Star, Trash } from "lucide-react";
import { Modal, Button } from "react-bootstrap";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api"; 
import { useParams } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useAuth();
  const { userId } = useParams(); // Get userId from URL
  const isOwner = user.id === parseInt(userId); // Is user viewing their own profile
  const [currentTab, setCurrentTab] = useState("posts"); // Default tab set to posts
  const [isEditing, setIsEditing] = useState(false); // State to monitor if user is editing details or not
  const [errorMessage, setErrorMessage] = useState(""); // Store error messages
  const [successMessage, setSuccessMessage] = useState(""); // Store success messages
  const api = useApi();
  const [fetchedUser, setFetchedUser] = useState(null); // To store user details for displaying
  const [editableUser, setEditableUser] = useState({ // To store edits user makes, is sent when updating
    first_name: "",
    last_name: "",
    bio: "",
    interests: "",
    profile_picture: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false); // Track when a user confirms edits on their profile
  const [followerCount, setFollowerCount] = useState(0); // Count of user's followers
  const [followingCount, setFollowingCount] = useState(0); // Count of user's following
  const [followingList, setFollowingList] = useState([]); // List of users following
  const [followerList, setFollowerList] = useState([]); // List of users followers
  const [isFollowing, setIsFollowing] = useState(false); // Used to display either follow or unfollow button

  const [showFollowersModal, setShowFollowersModal] = useState(false); // Show/hide follower modal
  const [showFollowingModal, setShowFollowingModal] = useState(false); // Show/hide following modal

  const handleShowFollowers = () => setShowFollowersModal(true); // Hide modal
  const handleCloseFollowers = () => setShowFollowersModal(false); // Show modal
  const handleShowFollowing = () => setShowFollowingModal(true); // Show modal
  const handleCloseFollowing = () => setShowFollowingModal(false); // Hide modal

  // Stores list user's achievements
  const [userAchievements, setUserAchievements] = useState([]);

  // For adding achievement, stores users input values
  const [newAchievementTitle, setNewAchievementTitle] = useState("")
  const [newAchievementDescription, setNewAchievementDescription] = useState("")
  const [newAchievementDate, setNewAchievementDate] = useState("")

  // Achievement error/success message to display errors on the achievements tab
  const [achievementErrorMessage, setAchievementErrorMessage] = useState("");
  const [achievementSuccessMessage, setAchievementSuccessMessage] = useState("");

  // Profile badges to display (bronze, silver, gold)
  // Count order: joined communities, following, followers, posts, comments, achievements 
  const [profileBadges, setProfileBadges] = useState([]);




  // List of user's posts
  const [userPosts, setUserPosts] = useState([]);

  // Fetch the posts of the viewed user
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

  // State for list of user's communities (and roles)
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

  // Get viewed user's achievements
  const fetchAchievements = async () =>{
    try {
      const response = await api.get(`api/achievements/?user_id=${userId}`);
      setUserAchievements(response.data);
      console.log(response);
    } catch (error) {
      console.error("Error fetching followers:", error);
      setErrorMessage("Failed to load followers.");
    }
  }

  // When user adds an achievement
  const handleAddAchievement = async () =>{
    try {
      // If any fields left blank set error and return
      if (!newAchievementTitle || !newAchievementDate || !newAchievementDescription) {
        setAchievementErrorMessage("Achievements must have a title, description, and date.");
        return;
      }
      
      // Using the input values to add achievement
      const response = await api.post("api/achievements/", {
        title: newAchievementTitle,
        description: newAchievementDescription,
        date_achieved: newAchievementDate,
      });
      
      // Reset inputs
      setNewAchievementTitle("");
      setNewAchievementDescription("");
      setNewAchievementDate("");

      // Update achievements list
      fetchAchievements();
      setAchievementSuccessMessage("Achievement added.");
      setAchievementErrorMessage("");
      console.log(response);
    } catch (error) {
      console.error("Error adding achievement:", error);
      setAchievementErrorMessage("Failed to add achievement. Please try again.");
    }
  }

  const handleDeleteAchievement = async (achievementID) =>{
    try {
      // Delete on passed ID
      await api.delete(`api/achievements/${achievementID}/`);
      
      // Update achievements list
      fetchAchievements();
      setAchievementSuccessMessage("Achievement removed.");
      setAchievementErrorMessage("");
    } catch (error) {
      console.error("Error removing achievement:", error);
      setAchievementErrorMessage("Failed to remove achievement. Please try again.");
    }
  }

  // Fetch achievements when achievement tab selected
  useEffect(() => {
    if (currentTab === "achievements" && userId) {
      fetchAchievements();
    }
  }, [currentTab, userId]);

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

  // Fetch badges for displaying the approriate badge icon and colour
  const fetchBadges = async (userId) => {
    try {
      const response = await api.get(`api/user-badges/?user_id=${userId}`);
      // Set badge colour
      setProfileBadges(response.data);
      console.log("Count and Colours for Badges:", response.data)
    } catch (error) {
      console.error("Error fetching user badges:", error);
      setErrorMessage("Failed to load user badges.");
    }
  };
  
  // Used to render the appropriate lucide-react icon
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Users':
        return <Users size={20} />;
      case 'UserPlus':
        return <UserPlus size={20} />;
      case 'UserCheck':
        return <UserCheck size={20} />;
      case 'FileText':
        return <FileText size={20} />;
      case 'MessageCircle':
        return <MessageCircle size={20} />;
      case 'Star':
        return <Star size={20} />;
      default:
        return;
    }
  };

  // Check if user is following the currently viewed user (for updating follow/unfollow button)
  const checkFollowing = async (userId) => {
    try {
      const response = await api.get(`api/follow/check_following/?user_id=${userId}`);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error("Error checking follow status:", error);
      setErrorMessage("Failed to check follow status.");
    }
  };

  // Fetch user details and following from the API using ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`user/${userId}/`);
        setFetchedUser(response.data);
        // Setting editable user to user data to pre-populate them for edits
        setEditableUser({
          id: response.data.id,
          first_name: response.data.first_name || "Unknown",
          last_name: response.data.last_name || "Unknown",
          bio: response.data.bio || "This user hasn't added a bio...",
          interests: response.data.interests || "This user hasn't added any interests...",
          profile_picture: response.data.profile_picture_url || default_profile_picture
        });
        fetchFollowers(response.data.id);
        fetchFollowing(response.data.id);
        checkFollowing(response.data.id);
        fetchBadges(response.data.id);
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
      // If not editing or edits are confirmed
      if (!isEditing || isConfirmed) {
        fetchUserData();
        if (isConfirmed) {
          setIsConfirmed(false);
        }
      }
    }
  }, [userId, isConfirmed]); // Runs when user Id or is confirmed changes

  // Fetch communities when "communities" tab is active
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
  
  // Handle profile editing inputs (sets editable user states to current values)
  const handleInputChange = (e) => {
    setEditableUser({ ...editableUser, [e.target.name]: e.target.value });
  };

  // When a user confirms their edits
  const handleSaveChanges = async () => {
    // Using form data due to profile picture
    const updatedUser = new FormData();
    
    // Only append if value has changed from fetched user details
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
    
    // If not default profile picture OR same as profile picture before
    if (editableUser.profile_picture && editableUser.profile_picture !== fetchedUser.profile_picture) {
      if (editableUser.profile_picture instanceof File) {
        updatedUser.append('profile_picture', editableUser.profile_picture);
      }
    }
  
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
  
  // If user cancels edit reset ediable user state to fetched user/default values
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

  // When a user unfollows
  const handleUnfollow = async () => {
    try {
      const response = await api.delete(`api/follow/unfollow/?user_id=${userId}`);
      // Refresh followers and following
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

  // When a user follows
  const handleFollow = async () => {
    try {
      const response = await api.post(`api/follow/follow/`, { user_id: userId });
      // Refresh followers and following
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

  // Unfollowing when using the modal, followerId attached to the row in modal
  const handleModalUnfollow = async (followerId) => {
    try {
      const response = await api.delete(`api/follow/unfollow/?user_id=${followerId}`);
      // Refresh follower and following
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

  // Following when using the modal, followerId attached to the row in modal
  const handleModalFollow = async (followerId) => {
    try {
      const response = await api.post(`api/follow/follow/`, { user_id: followerId });
      // Refresh follower and following
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
            <div className="d-flex justify-content-between align-items-center">
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

              {/* Display the profiles badges */}
              <div className="d-flex flex-wrap ms-auto">      
                {/* For each badge create icon, colour and count and format title from the key */}      
                {profileBadges && Object.keys(profileBadges).map((badgeKey) => {
                  const badge = profileBadges[badgeKey];

                    return (
                      // Using bootstrap danger, success and warning to display badge colour
                      // Using lucide-react icons
                      // Count is number of occurences in db for specific badge
                      <div
                        key={badgeKey}
                        className={`badge-item me-3 p-2 text-${badge.badge_level}`}
                        title={badge.badge_title}
                      >
                        {renderIcon(badge.badge_icon)}
                      </div>
                    );
                })}
              </div>
            </div>
            <p className="text-muted">{fetchedUser.university.university_name || "Unknown"}</p>
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
            
            {/* Only display if own profile and is editing */}
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
      
      {/* Tabs to allow show/hide of different data attached to the user */}
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
            className={`nav-link ${currentTab === "achievements" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("achievements")}
          >
            Achievements
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
                {/* Limit to last  5 posts */}
                {userPosts.slice(0, 5).map((post) => (
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

        {/* Communities tab to list a user's communities */}
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

        {/* Achievements tab to list user's achievements and provide inputs to add an achievments */}
        {currentTab === "achievements" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">User Achievements</h5>
                {/* Has to be viewing own profile */}
                {isOwner && (
                  <div className="mb-4 p-3 border rounded bg-light">
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Achievement Title"
                      value={newAchievementTitle}
                      onChange={(e) => setNewAchievementTitle(e.target.value)}
                    />
                    <textarea
                      className="form-control mb-2"
                      placeholder="Achievement Description"
                      value={newAchievementDescription}
                      onChange={(e) => setNewAchievementDescription(e.target.value)}
                    ></textarea>
                    <input
                      type="date"
                      className="form-control mb-2"
                      value={newAchievementDate}
                      onChange={(e) => setNewAchievementDate(e.target.value)}
                    />
                    <Button variant="primary" onClick={handleAddAchievement}>Add Achievement</Button>
                  </div>
                )}

                {/* If no achievements use fall back message */}
                {userAchievements.length > 0 ? (
                  <ul className="list-group">
                    {/* For each achievement */}
                    {userAchievements.map((achievement) => (
                      <li key={achievement.id} className="list-group-item d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong className="fs-5">{achievement.title}</strong>
                          <span className="text-muted small">Date Achieved: {achievement.date_achieved}</span>
                          {isOwner && (
                            <button
                              className="btn btn-outline-danger btn-sm mt-2"
                              onClick={() => handleDeleteAchievement(achievement.id)}
                            >
                              <Trash size={20} />
                            </button>
                          )}
                        </div>
                        <p className="mb-1 text-secondary">{achievement.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No achievements have been added.</p>
                )}
                {/* Achievement specific error messages */}
                {achievementSuccessMessage && <p className="text-success mt-2">{achievementSuccessMessage}</p>}
                {achievementErrorMessage && <p className="text-danger mt-2">{achievementErrorMessage}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab for viewing user's attending events */}
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

      {/* Modal which allows the viewing of followers */}
      <Modal show={showFollowersModal} onHide={handleCloseFollowers}>
      <Modal.Header closeButton>
        <Modal.Title>Followers</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* If no followers use fallback message */}
        {followerList.length > 0 ? (
          <ul className="list-group">
            {/* For each follower */}
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

      {/* Modal which allows the viewing of following */}
      <Modal show={showFollowingModal} onHide={handleCloseFollowing}>
      <Modal.Header closeButton>
        <Modal.Title>Following</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* If no following use fallback message */}
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
