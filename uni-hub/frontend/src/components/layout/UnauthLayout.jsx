import { Outlet } from "react-router-dom";
import logo from "../../assets/images/logo.png"

const MainLayout = () => {
  return (
    <>
        <div className="d-flex justify-content-center my-4">
            <img src={logo} alt="logo" className="img-fluid" style={{ width: "200px" }} />
        </div>
        <Outlet />
    </>
  );
};

export default MainLayout;
