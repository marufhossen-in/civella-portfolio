import { RouterProvider } from "react-router-dom";
import { AppProviders } from "@/store";
import { router } from "@/router";
import { ToastViewport } from "@/components/shared";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <ToastViewport />
    </AppProviders>
  );
}
