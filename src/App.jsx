import { Outlet } from 'react-router-dom';
import "./index.css";

function App() {
  return (
    <div>
      {/* This is where nested routes will be rendered */}
      <Outlet />
    </div>
  );
}

export default App;