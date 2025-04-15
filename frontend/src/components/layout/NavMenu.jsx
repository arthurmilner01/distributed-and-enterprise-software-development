import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Home,
  User,
  Users,
  Calendar,
  Bell,
  LogOut,
  Settings,
  Compass
} from 'lucide-react';
import '../../assets/styles/NavMenu.css';
import { useAuth } from "../../context/AuthContext";


const NavMenu = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, signOut } = useAuth();
  const isAdmin = user && user.role === 'A';
 
  //Handle menu click
  const handleToggleClick = () => {
    setIsActive(!isActive);
  };
 
  //Check if mobile on page load/screen size change
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
   
    //First check on render
    checkIfMobile();
   
    // Add resize listener incase manual resize
    window.addEventListener('resize', checkIfMobile);
   
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);


  const openDjangoAdmin = () => {
    window.open('http://localhost:8000/admin', '_blank');
  };
  
  return (
    <>
      <header className={`site-header ${isMobile ? 'header-visible' : ''}`}>
        <div className="toggle" onClick={handleToggleClick}>
          <Menu size={20} />
        </div>
        <h3>Dashboard</h3>
        <Link to="/logout">
          <LogOut size={20} />
        </Link>
      </header>
   
      <nav className={`side-nav ${isActive ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}>
        <ul>
          <li>
            <a className={`toggle ${isMobile ? 'hidden' : ''}`} onClick={handleToggleClick}>
              <span className="icon"><Menu size={20} /></span>
              <span className="title">Menu</span>
            </a>
          </li>
         
          <li>
            <Link to="/">
              <span className="icon"><Home size={20} /></span>
              <span className="title">Home</span>
            </Link>
          </li>
         
          <li>
            <Link to={`/profile/${user?.id}`}>
              <span className="icon"><User size={20} /></span>
              <span className="title">Profile</span>
            </Link>
          </li>
 
          <li>
            <Link to="/communities">
              <span className="icon"><Users size={20} /></span>
              <span className="title">Communities</span>
            </Link>
          </li>
         
          <li>
            <Link to="/events">
              <span className="icon"><Calendar size={20} /></span>
              <span className="title">Events</span>
            </Link>
          </li>

          <li>
            <Link to="/discover">
              <span className="icon"><Compass size={20} /></span>
              <span className="title">Discover</span>
            </Link>
          </li>
         
          <li>
            <Link to="/notifications">
              <span className="icon"><Bell size={20} /></span>
              <span className="title">Notifications</span>
            </Link>
          </li>
       
          {isAdmin && (
            <li>
              <a onClick={openDjangoAdmin} style={{ cursor: 'pointer' }}>
                <span className="icon"><Settings size={20} /></span>
                <span className="title">Django Admin</span>
              </a>
            </li>
          )}
          <li>
            <button onClick={signOut}>
              <span className="icon"><LogOut size={20} /></span>
              <span className="title">Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default NavMenu;