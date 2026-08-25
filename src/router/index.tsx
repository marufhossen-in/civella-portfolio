import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AgentLayout } from "@/components/layout/AgentLayout";
import { ProtectedRoute } from "@/router/ProtectedRoute";

import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/PricingPage";
import { LoginPage, SignupPage } from "@/pages/Auth";
import { PaymentPage, PaymentSuccessPage } from "@/pages/PaymentFlow";
import { ListingDetailPage, ListingsPage } from "@/pages/Listings";
import {
  AboutPage,
  AgentProfilePage,
  AgentsPage,
  FeaturesPage,
  HelpPage,
  NeighborhoodPage,
  NeighborhoodsPage,
  NotFoundPage,
  ValuationPage,
} from "@/pages/Discover";
import {
  AdminPage,
  AgentDashboardPage,
  AgentListingsPage,
  ListingEditorPage,
  LeadInboxPage,
  NotificationsPage,
} from "@/pages/AgentPortal";
import AgentProfilePagePortal from "@/pages/AgentProfile";
import AgentSettingsPage from "@/pages/AgentSettings";

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "listings", element: <ListingsPage /> },
      { path: "listings/:listingId", element: <ListingDetailPage /> },
      { path: "neighborhoods", element: <NeighborhoodsPage /> },
      { path: "neighborhoods/:areaId", element: <NeighborhoodPage /> },
      { path: "valuation", element: <ValuationPage /> },
      { path: "agents", element: <AgentsPage /> },
      { path: "agents/:agentId", element: <AgentProfilePage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "/auth/login", element: <LoginPage /> },
  { path: "/auth/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/payment", element: <PaymentPage /> },
      { path: "/payment/success", element: <PaymentSuccessPage /> },
      { path: "/agent/profile", element: <AgentProfilePagePortal /> },
      { path: "/agent/settings", element: <AgentSettingsPage /> },
      {
        element: <AgentLayout />,
        children: [
          { path: "/agent/dashboard", element: <AgentDashboardPage /> },
          { path: "/agent/listings", element: <AgentListingsPage /> },
          { path: "/agent/listings/:id", element: <ListingEditorPage /> },
          { path: "/agent/leads", element: <LeadInboxPage /> },
          { path: "/agent/notifications", element: <NotificationsPage /> },
          { path: "/admin", element: <AdminPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
