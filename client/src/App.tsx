import "./App.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import Loading from "./components/Utility/Loading/Loading";

// Lazy imports
const Home = lazy(() => import("./pages/Home/Home"));
const Navbar = lazy(() => import("./components/Navbar/Navbar"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const RoomPage = lazy(() => import("./pages/RoomPage/RoomPage"));
const WorkspaceDashboard = lazy(() => import("./pages/WorkspaceDashboard/WorkspaceDashboard"));
const RoomDetails = lazy(() => import("./pages/RoomDetails/RoomDetails"));
const PageNotFound = lazy(() => import("./components/Utility/PageNotFound/PageNotFound"));

const RedirectWithSearch = ({ to }: { to: string }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
};

const LowercasePathRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={`${location.pathname.toLowerCase()}${location.search}${location.hash}`}
      replace
    />
  );
};

function App() {
  return (
    
      <Suspense fallback={<Loading/>}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<WorkspaceDashboard />} />
          <Route path="/dashboard/rooms/:roomID" element={<RoomDetails />} />
          <Route path="/room-page" element={<RoomPage />} />
          <Route path="/room" element={<Dashboard />} />
          <Route path="/playground" element={<Dashboard />} />
          <Route path="/Dashboard" element={<RedirectWithSearch to="/dashboard" />} />
          <Route
            path="/Dashboard/rooms/:roomID"
            element={<LowercasePathRedirect />}
          />
          <Route path="/RoomPage" element={<RedirectWithSearch to="/room-page" />} />
          <Route path="/Room" element={<RedirectWithSearch to="/room" />} />
          <Route path="/Playground" element={<RedirectWithSearch to="/playground" />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    
  );
}

export default App;
