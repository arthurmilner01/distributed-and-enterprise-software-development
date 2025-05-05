import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Post from "../widgets/Post";
import PaginationComponent from "../widgets/PaginationComponent";
import CreatePost from "../widgets/CreatePost";


const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  // Stores all posts under the global community
  const [posts, setPosts] = useState([]);
  // Stores posts by the user's followed profiles
  const [userPosts, setUserPosts] = useState([]);
  // Stores community posts to be filtered by user's joined communities
  const [communityPosts, setCommunityPosts] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState({});
  const api = useApi();

  const [newPostImage, setNewPostImage] = useState(null);
  
  // Default tab explore posts, state used to set tab
  const [currentTab, setCurrentTab] = useState("explore-posts");
  // For hashtag searching
  const [hashtagOptions, setHashtagOptions] = useState([]);
  const [hashtagSelected, setHashtagSelected] = useState([]);
  // For pagination of posts
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = useCallback((newPage) => {
          setCurrentPage(newPage);
  }, []); 

  const fetchPosts = async (page = 1) => {
    try {
      const response = await api.get(`api/posts/?page=${page}&community=all`);
      const data = response.data.results ? response.data.results : response.data;
      setPosts(Array.isArray(data) ? data : []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.total_pages || 1);
      console.log("Posts:", posts);
      console.log("Total Pages:", totalPages);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrorMessage("Failed to fetch posts.");
      setPosts([]);
    }
  };

  // Get posts from user's joined communities
  const fetchCommunityPosts = async (page = 1) => {
    try {
      const response = await api.get(`api/posts/communities?page=${page}`);
      const data = response.data.results ? response.data.results : response.data;
      setCommunityPosts(Array.isArray(data) ? data : []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.total_pages || 1);
      console.log("Community Posts:", data);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      setErrorMessage("Failed to load community posts.");
      setCommunityPosts([]);
    }
  };

  // Get posts from user's followed profiles
  const fetchUserPosts = async (page = 1) => {
    try {
      const response = await api.get(`api/posts/following?page=${page}`);
      const data = response.data.results ? response.data.results : response.data;
      setUserPosts(Array.isArray(data) ? data : []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.total_pages || 1);
      console.log("User Posts:", data);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setErrorMessage("Failed to load followed user posts.");
      setUserPosts([]);
    }
  };



  // Update global posts when the "explore-posts" tab is set to active
  useEffect(() => {
    if (currentTab === "explore-posts") {
      setCurrentPage(1);
      fetchPosts(1);
    }
  }, [currentTab]);

  // Update user following posts when the "user-posts" tab is set to active
  useEffect(() => {
    if (currentTab === "user-posts") {
      setCurrentPage(1);
      fetchUserPosts(1);
    }
  }, [currentTab]);

  // Fetch community posts on community-posts tab
  useEffect(() => {
    if (currentTab === "community-posts") {
      setCurrentPage(1);
      fetchCommunityPosts(1);
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === "explore-posts") {
      fetchPosts(currentPage); // Fetch posts based on currentPage
    } else if (currentTab === "user-posts") {
      fetchUserPosts(currentPage); // Fetch user posts based on currentPage
    } else if (currentTab === "community-posts") {
      fetchCommunityPosts(currentPage); // Fetch community posts based on currentPage
    }
  }, [currentPage]); // On page change to change posts displayed

  useEffect(() => {
    fetchPosts(currentPage);
  }, []);

  const handlePostSubmit = async (event) => {
    event.preventDefault();
  
    // Prevent submission if both text and image are missing
    if (!newPost.trim() && !newPostImage) {
      setErrorMessage("Please add text or an image before posting.");
      return;
    }
  
    const formData = new FormData();
    formData.append("post_text", newPost);
    if (newPostImage) {
      formData.append("image", newPostImage);
    }
  
    try {
      const response = await api.post("api/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
  
      setPosts([response.data, ...posts]);
      setNewPost("");
      setNewPostImage(null);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };
  

  // Handles submitting likes on a specific post
  const handleLikeToggle = async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/toggle-like/`);
      const updatedPosts = posts.map((post) =>
        post.id === postId
          ? {
            ...post,
            liked_by_user: response.data.liked,
            like_count: response.data.like_count,
          }
          : post
      );
      fetchPosts(currentPage);
      fetchCommunityPosts(currentPage);
      fetchUserPosts(currentPage);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

   // To save a posted comment
   const handleCommentSubmit = async (event, postId) => {
    event.preventDefault();
    if (!newComment[postId] || newComment[postId].trim() === "") return;
  
    try {
      const response = await api.post(
        `api/posts/${postId}/comments/`,
        {
          comment_text: newComment[postId],
          post: postId,
        }
      );
      console.log("Comment created:", response.data);
      fetchPosts(currentPage);
      fetchCommunityPosts(currentPage);
      fetchUserPosts(currentPage);
      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  // Using regular expression to make hashtags links
  function renderPostText(text) {
    // If a hashtag is used before the word make it a clickable link
    // Browses to filtered posts which contain that hashtag
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith("#")) {
        const tag = word.slice(1);
        return (
          <span
            key={index}
            className="text-info"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/hashtag/${tag}`)}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  }

  const handleDeletePost = async (postId) => {
    try {
      // Send DELETE request
      const response = await api.delete(`/api/posts/${postId}/`);
  
      // Update the state to reflect the deleted post
      setCurrentPage(1); // Just in-case post is last on a page
      fetchPosts(currentPage);
      fetchCommunityPosts(currentPage);
      fetchUserPosts(currentPage);
      setSuccessMessage("Post successfully deleted.");
      setErrorMessage("");
    } catch (error) {
      // Handle error if deletion fails
      console.error("Error deleting post:", error);
      setErrorMessage("Failed to delete the post, does the post belong to you?.");
      setSuccessMessage("");
    }
  };

  // When searching get the options to display via typeahead
  const handleHashtagSearch = async (query) => {
    try {
      const response = await api.get(`/api/posts/search-hashtags?hashtag_query=${query}`);
      console.log("Fetched hashtags:", response); // This shows actual response
      setHashtagOptions(response.data); // Display returned hashtags
    } catch (error) {
      console.error("Error fetching hashtags:", error);
    }
  };

  // When typeahead selected navigate to filter posts by that hashtag
  const handleHashtagChange = (selected) => {
    setHashtagSelected(selected);
    // If selected exists navigate
    if (selected.length > 0) {
      navigate(`/hashtag/${selected[0].name}`);
    }
  };
  

  if (loading) return <p>Loading user data...</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "20px auto" }}>
      <h2>Welcome, {user.first_name || "User"}!</h2>

      {errorMessage && (
        <div className="alert alert-danger mt-3">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="alert alert-success mt-3">{successMessage}</div>
      )}
      {/* Search by hashtag section */}
      <div className="mb-3 p-3 bg-light-subtle border border-secondary-subtle" style={{borderRadius: "10px"}}>
        <p><Search size={20}/> Search by hashtag:</p>
        <Typeahead
          labelKey="name"
          onInputChange={handleHashtagSearch}
          options={hashtagOptions}
          placeholder="Search posts by hashtag..."
          onChange={handleHashtagChange}
          selected={hashtagSelected}
          minLength={1}
          allowNew={false}
          renderMenuItemChildren={(option) => (
            <div>
              #{option.name}
            </div>
          )}
        />
     </div>
     <hr className="m-3"></hr>
      {/* Create Post Section */}
      <CreatePost
        newPost={newPost}
        setNewPost={setNewPost}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        handlePostSubmit={handlePostSubmit}
      />

      {/* Tabs to allow show/hide of different post types to the user */}
      <ul className="nav nav-pills mb-3 d-flex justify-content-center" id="profile-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "explore-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("explore-posts")}
          >
            Explore
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "user-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("user-posts")}
          >
            Following
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "community-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("community-posts")}
          >
           Community
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">

        {currentTab === "explore-posts" && (
        <div className="tab-pane fade show active">
          {/* Posts Section */}
          <div>
            {posts.length === 0 ? (
              <p>No posts in the global feed yet.</p>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  user={user}
                  renderPostText={renderPostText}
                  handleLikeToggle={handleLikeToggle}
                  handleDeletePost={handleDeletePost}
                  handleCommentSubmit={handleCommentSubmit}
                  newComment={newComment}
                  setNewComment={setNewComment}
                />
              ))
            )}
            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                  <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
              </div>
            )}
          </div>
        </div>
        )}

        {currentTab === "user-posts" && (
        <div className="tab-pane fade show active">
          {/* User Posts Section */}
          <div>
            {userPosts.length === 0 ? (
              <p>No posts in the following feed yet. Try following some users!</p>
            ) : (
              userPosts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  user={user}
                  renderPostText={renderPostText}
                  handleLikeToggle={handleLikeToggle}
                  handleDeletePost={handleDeletePost}
                  handleCommentSubmit={handleCommentSubmit}
                  newComment={newComment}
                  setNewComment={setNewComment}
                />
              ))
            )}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                  <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
              </div>
            )}
          </div>
        </div>
        )}

        {currentTab === "community-posts" && (
        <div className="tab-pane fade show active">
        {/* User Posts Section */}
        <div>
          {communityPosts.length === 0 ? (
            <p>No posts in the community posts feed yet. Try joining a community!</p>
          ) : (
            communityPosts.map((communityPost) => (
              <Post
              key={communityPost.id}
              post={communityPost}
              user={user}
              renderPostText={renderPostText}
              handleLikeToggle={handleLikeToggle}
              handleDeletePost={handleDeletePost}
              handleCommentSubmit={handleCommentSubmit}
              newComment={newComment}
              setNewComment={setNewComment}
              />
            ))
          )}
          {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                  <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
              </div>
            )}
        </div>
      </div>
        )}

      </div>
    </div>
  )
}
export default DashboardPage;

