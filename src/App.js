import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Summary from "./pages/Summary";
import Notes from "./pages/Notes";
import CreateNote from "./pages/CreateNote";
import ViewNote from "./pages/ViewNote";
import Summaries from "./pages/Summaries";
import SummaryView from "./pages/SummaryView";
import Flashcards from "./pages/Flashcards";   // ✅ Flashcard Dashboard
import Practice from "./pages/Practice";       // ✅ Practice Mode
import Quiz from "./pages/Quiz";  
import Chat from "./pages/Chat";             // ✅ Quiz Mode
import SmartSearch from "./pages/SmartSearch";
import Favorites from "./pages/Favorites";
import Analytics from "./pages/Analytics";
import Goals from './pages/Goals';
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public Routes ─── */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* ─── Protected Routes ─── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />

        {/* ─── AI Summary Routes ─── */}
        <Route
          path="/summary/:documentId"
          element={
            <ProtectedRoute>
              <Summary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-summaries"
          element={
            <ProtectedRoute>
              <Summaries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary/view/:id"
          element={
            <ProtectedRoute>
              <SummaryView />
            </ProtectedRoute>
          }
        />

        {/* ─── Notes Routes ─── */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/create"
          element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/edit/:id"
          element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/view/:id"
          element={
            <ProtectedRoute>
              <ViewNote />
            </ProtectedRoute>
          }
        />

        {/* ─── Flashcard Routes ─── */}
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <Flashcards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route 
        path="/chat" 
        element={<ProtectedRoute>
          <Chat />
          </ProtectedRoute>
        } 
        />
        <Route
         path="/smart-search" 
         element={<ProtectedRoute>
          <SmartSearch />
          </ProtectedRoute>
        } 
        />
        <Route 
        path="/favorites" 
        element={<ProtectedRoute>
          <Favorites />
          </ProtectedRoute>
        } 
        />
        <Route 
        path="/analytics" 
        element={<ProtectedRoute>
          <Analytics />
          </ProtectedRoute>
        } 
        />
        <Route 
        path="/goals" 
        element={<ProtectedRoute>
          <Goals />
          </ProtectedRoute>
        }
         />
         <Route
          path="/profile" 
          element={<Profile />
          } 
          />
          <Route 
          path="/settings" 
          element={<Settings />
          } 
          />
      </Routes>
    </BrowserRouter>
  );
}

export default App;