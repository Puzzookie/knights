import './index.css';

import { React } from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';

import KnightsTour from './components/KnightsTour.jsx';  // ✅ Make sure the path is correct
import NoMatch from './pages/NoMatch.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

function KnightsTourPage() {
  const [searchParams] = useSearchParams();
  const puzzle = searchParams.get("p") || "1111111111111111111111111111111111111111111111111111111111111111";
  const cols = parseInt(searchParams.get("c") || "8");

  return <KnightsTour puzzle={puzzle} cols={cols} />;
}

root.render(
  <Router>
    <Routes>
      <Route path="/" element={<KnightsTourPage />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  </Router>
);