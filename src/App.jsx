import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { pagesConfig } from "./pages.config";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import LicensePage from "./pages/LicensePage";
import LoginPage from "./pages/LoginPage";

const { Pages = {}, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];

const renderContent = (content) => {
  if (typeof content === "function") {
    const Component = content;
    return <Component />;
  }
  return content;
};

const LayoutWrapper = ({ children, currentPageName }) => {
  if (!Layout) return <>{children}</>;
  if (typeof Layout === "function") {
    const LayoutComponent = Layout;
    return (
      <LayoutComponent currentPageName={currentPageName}>
        {children}
      </LayoutComponent>
    );
  }
  return React.cloneElement(Layout, { currentPageName }, children);
};

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // Boot: checking session
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → show login page (even inside HashRouter so /license still works)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/license" element={<LicensePage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Logged in → show full app
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            {renderContent(Pages[mainPageKey])}
          </LayoutWrapper>
        }
      />
      <Route path="/license" element={<LicensePage />} />
      {Object.entries(Pages).map(([path, PageContent]) => {
        const routePath = path.toLowerCase().replace(/\s+/g, "-");
        return (
          <Route
            key={path}
            path={`/${routePath}`}
            element={
              <LayoutWrapper currentPageName={path}>
                {renderContent(PageContent)}
              </LayoutWrapper>
            }
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
