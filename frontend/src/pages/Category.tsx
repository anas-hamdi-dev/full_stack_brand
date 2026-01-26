import { Navigate } from "react-router-dom";

// Category page removed - redirecting to brands page
// Categories feature removed for MVP simplicity
const Category = () => {
  return <Navigate to="/brands" replace />;
};

export default Category;
