import { StoreProvider, useStore } from "./app/store";
import { Shell } from "./app/shell";
import { Auth } from "./app/views/Auth";
import { Dashboard } from "./app/views/Dashboard";
import { Goals } from "./app/views/Goals";
import { Habits } from "./app/views/Habits";
import { Schedule } from "./app/views/Schedule";
import { Finance } from "./app/views/Finance";
import { Reminders } from "./app/views/Reminders";
import { Review } from "./app/views/Review";
import { SettingsView } from "./app/views/SettingsView";
import { QuickForms, GoalForm } from "./app/forms";
import { PwaInstallBanner } from "./app/pwa";
import { useEffect, useState } from "react";

const Views = () => {
  const { view } = useStore();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);
  const V = { beranda: Dashboard, tujuan: Goals, kebiasaan: Habits, jadwal: Schedule, keuangan: Finance, pengingat: Reminders, evaluasi: Review, pengaturan: SettingsView }[view];
  return <div key={view} className="animate-rise"><V /></div>;
};

const FirstGoal = () => {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  useEffect(() => { if (data.user && data.goals.length === 0 && !asked) { setOpen(true); setAsked(true); } }, [data.user, data.goals.length, asked]);
  return <GoalForm open={open} first onClose={() => setOpen(false)} />;
};

const Root = () => {
  const { data } = useStore();
  if (!data.user) {
    return (
      <>
        <Auth />
        <PwaInstallBanner />
      </>
    );
  }
  return (
    <Shell>
      <Views />
      <QuickForms />
      <FirstGoal />
      <PwaInstallBanner />
    </Shell>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
