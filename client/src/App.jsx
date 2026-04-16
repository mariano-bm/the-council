import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NominationsPage from './pages/NominationsPage';
import CalendarPage from './pages/CalendarPage';
import VotingPage from './pages/VotingPage';
import ReviewsPage from './pages/ReviewsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import RanksPage from './pages/RanksPage';
import RewardsPage from './pages/RewardsPage';
import ShameHolePage from './pages/ShameHolePage';
import AdminPage from './pages/AdminPage';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/actividades" element={<NominationsPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile/:id?" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/rangos" element={<RanksPage />} />
        <Route path="/recompensas" element={<RewardsPage />} />
        <Route path="/hoyo" element={<ShameHolePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
