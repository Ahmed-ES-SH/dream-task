import { useState } from "react";

import {
  Dialog,
  DialogBackdrop,
  DialogCloseButton,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import UserProfileCard from "@/components/dashboard/UserProfileCard";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.description")}</p>
      </header>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast.success("Demo success toast")}>
          Show success toast
        </Button>
        <Button variant="outline" onClick={() => toast.error("Demo error toast")}>
          Show error toast
        </Button>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogBackdrop />
        <DialogPopup>
          <DialogCloseButton />
          <DialogTitle>Demo dialog</DialogTitle>
          <DialogDescription>
            Tab cycles inside; Esc, backdrop and X close; focus returns to trigger.
          </DialogDescription>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogPopup>
      </Dialog>

      <UserProfileCard />
    </div>
  );
}
