import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ActivitiesHub from './pages/ActivitiesHub';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import RoulettePage from './pages/RoulettePage';
import VotingPage from './pages/VotingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CodexPage from './pages/CodexPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import ShameHolePage from './pages/ShameHolePage';
import AdminPage from './pages/AdminPage';
import BrawlhallaControlPage from './pages/BrawlhallaControlPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/actividades" element={<ActivitiesHub />} />
        <Route path="/juegos" element={<GamesPage />} />
        <Route path="/juegos/:id" element={<GameDetailPage />} />
        <Route path="/ruleta" element={<RoulettePage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/codex" element={<CodexPage />} />
        <Route path="/profile/:id?" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/hoyo" element={<ShameHolePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/torneos" element={<TournamentsPage />} />
        <Route path="/torneos/overlay" element={<BrawlhallaControlPage />} />
        <Route path="/torneos/:id" element={<TournamentDetailPage />} />
        {/* Redirects de rutas viejas */}
        <Route path="/rangos" element={<Navigate to="/codex" />} />
        <Route path="/recompensas" element={<Navigate to="/codex" />} />
        <Route path="/calendario" element={<Navigate to="/actividades" />} />
        <Route path="/reviews" element={<Navigate to="/actividades" />} />
        <Route path="/nominations" element={<Navigate to="/actividades" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
