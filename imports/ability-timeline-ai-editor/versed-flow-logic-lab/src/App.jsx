import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import NodeLibrary from '@/pages/NodeLibrary';
import BehaviorTreeEditor from '@/pages/BehaviorTreeEditor';
import FsmEditor from '@/pages/FsmEditor';
import TestEnvironment from '@/pages/TestEnvironment';
import AbilityLab from '@/pages/AbilityLab';
import RouteEditor from '@/pages/RouteEditor';
import DesignDoc from '@/pages/DesignDoc';
import GraphLab from '@/pages/GraphLab';
import UtilityIntelligence from '@/pages/UtilityIntelligence';
import UtilityInputs from '@/pages/UtilityInputs';
import UtilityNormalizations from '@/pages/UtilityNormalizations';
import UtilityConsiderations from '@/pages/UtilityConsiderations';
import UtilityTargetFilters from '@/pages/UtilityTargetFilters';
import UtilityActionTasks from '@/pages/UtilityActionTasks';
import GoapEditor from '@/pages/GoapEditor';
import HtnEditor from '@/pages/HtnEditor';
import GrandStrategy from '@/pages/GrandStrategy';
import SelfTest from '@/pages/SelfTest';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/nodes" element={<NodeLibrary />} />
        <Route path="/bt" element={<BehaviorTreeEditor />} />
        <Route path="/fsm" element={<FsmEditor />} />
        <Route path="/test" element={<TestEnvironment />} />
        <Route path="/lab" element={<AbilityLab />} />
        <Route path="/routes" element={<RouteEditor />} />
        <Route path="/stances" element={<Navigate to="/fsm?asset=StanceMachine" replace />} />
        <Route path="/docs" element={<DesignDoc />} />
        <Route path="/graph" element={<GraphLab />} />
        <Route path="/utility" element={<UtilityIntelligence />} />
        <Route path="/utility/inputs" element={<UtilityInputs />} />
        <Route path="/utility/normalizations" element={<UtilityNormalizations />} />
        <Route path="/utility/considerations" element={<UtilityConsiderations />} />
        <Route path="/utility/filters" element={<UtilityTargetFilters />} />
        <Route path="/utility/actions" element={<UtilityActionTasks />} />
        <Route path="/goap" element={<GoapEditor />} />
        <Route path="/htn" element={<HtnEditor />} />
        <Route path="/grand" element={<GrandStrategy />} />
        <Route path="/selftest" element={<SelfTest />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
