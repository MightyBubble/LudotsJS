import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AssetLibrary from './pages/AssetLibrary';
import EffectLibrary from './pages/EffectLibrary';
import AbilityLibrary from './pages/AbilityLibrary';
import ProjectOverview from './pages/ProjectOverview';
import InputSystem from './pages/InputSystem';
import InputConfigEditor from './pages/InputConfigEditor';
import ControlSchemeEditor from './pages/ControlSchemeEditor';
import CommandIntentEditor from './pages/CommandIntentEditor';
import InputOrderEditor from './pages/InputOrderEditor';
import CastCommitEditor from './pages/CastCommitEditor';
import CastDispatchEditor from './pages/CastDispatchEditor';
import ControlPlaneEditor from './pages/ControlPlaneEditor';
import EntityCollectionEditor from './pages/EntityCollectionEditor';
import CommandPanelEditor from './pages/CommandPanelEditor';
import CommandPanelRuntime from './pages/CommandPanelRuntime';
import AbilityPlayground from './pages/AbilityPlayground';
import ParticipantEditor from './pages/ParticipantEditor';
import MapConfigEditor from './pages/MapConfigEditor';
import LevelBlueprintEditor from './pages/LevelBlueprintEditor';
import PerformerEditor from './pages/PerformerEditor';
import HostAssetBindingEditor from './pages/HostAssetBindingEditor';
import PresentationConfigEditor from './pages/PresentationConfigEditor';
import AbilitySemanticProfileEditor from './pages/AbilitySemanticProfileEditor';
import { ProjectScopeProvider } from '@/lib/projectScope';
import I18nProvider from '@/i18n/I18nProvider';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

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
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/AssetLibrary" element={<LayoutWrapper currentPageName="AssetLibrary"><AssetLibrary /></LayoutWrapper>} />
      <Route path="/EffectLibrary" element={<LayoutWrapper currentPageName="EffectLibrary"><EffectLibrary /></LayoutWrapper>} />
      <Route path="/AbilityLibrary" element={<LayoutWrapper currentPageName="AbilityLibrary"><AbilityLibrary /></LayoutWrapper>} />
      <Route path="/ProjectOverview" element={<LayoutWrapper currentPageName="ProjectOverview"><ProjectOverview /></LayoutWrapper>} />
      <Route path="/InputSystem" element={<LayoutWrapper currentPageName="InputSystem"><InputSystem /></LayoutWrapper>} />
      <Route path="/InputConfigEditor" element={<LayoutWrapper currentPageName="InputConfigEditor"><InputConfigEditor /></LayoutWrapper>} />
      <Route path="/ControlSchemeEditor" element={<LayoutWrapper currentPageName="ControlSchemeEditor"><ControlSchemeEditor /></LayoutWrapper>} />
      <Route path="/CommandIntentEditor" element={<LayoutWrapper currentPageName="CommandIntentEditor"><CommandIntentEditor /></LayoutWrapper>} />
      <Route path="/InputOrderEditor" element={<LayoutWrapper currentPageName="InputOrderEditor"><InputOrderEditor /></LayoutWrapper>} />
      <Route path="/CastCommitEditor" element={<LayoutWrapper currentPageName="CastCommitEditor"><CastCommitEditor /></LayoutWrapper>} />
      <Route path="/CastDispatchEditor" element={<LayoutWrapper currentPageName="CastDispatchEditor"><CastDispatchEditor /></LayoutWrapper>} />
      <Route path="/ControlPlaneEditor" element={<LayoutWrapper currentPageName="ControlPlaneEditor"><ControlPlaneEditor /></LayoutWrapper>} />
      <Route path="/EntityCollectionEditor" element={<LayoutWrapper currentPageName="EntityCollectionEditor"><EntityCollectionEditor /></LayoutWrapper>} />
      <Route path="/CommandPanelEditor" element={<LayoutWrapper currentPageName="CommandPanelEditor"><CommandPanelEditor /></LayoutWrapper>} />
      <Route path="/CommandPanelRuntime" element={<LayoutWrapper currentPageName="CommandPanelRuntime"><CommandPanelRuntime /></LayoutWrapper>} />
      <Route path="/AbilitySemanticProfileEditor" element={<LayoutWrapper currentPageName="AbilitySemanticProfileEditor"><AbilitySemanticProfileEditor /></LayoutWrapper>} />
      <Route path="/AbilityPlayground" element={<LayoutWrapper currentPageName="AbilityPlayground"><AbilityPlayground /></LayoutWrapper>} />
      <Route path="/ParticipantEditor" element={<LayoutWrapper currentPageName="ParticipantEditor"><ParticipantEditor /></LayoutWrapper>} />
      <Route path="/MapConfigEditor" element={<LayoutWrapper currentPageName="MapConfigEditor"><MapConfigEditor /></LayoutWrapper>} />
      <Route path="/LevelBlueprintEditor" element={<LayoutWrapper currentPageName="LevelBlueprintEditor"><LevelBlueprintEditor /></LayoutWrapper>} />
      <Route path="/PerformerEditor" element={<LayoutWrapper currentPageName="PerformerEditor"><PerformerEditor /></LayoutWrapper>} />
      <Route path="/HostAssetBindingEditor" element={<LayoutWrapper currentPageName="HostAssetBindingEditor"><HostAssetBindingEditor /></LayoutWrapper>} />
      <Route path="/PresentationConfigEditor" element={<LayoutWrapper currentPageName="PresentationConfigEditor"><PresentationConfigEditor /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <I18nProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ProjectScopeProvider>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
        </ProjectScopeProvider>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
    </I18nProvider>
  )
}

export default App