import { Outlet } from 'react-router-dom';
import NavMenu from './NavMenu'; 

const MainLayout = () => {
  return (
    <>
      <NavMenu />
     
      <main className="content">
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;