import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster"
      toastOptions={{
        classNames: {
          toast: "bg-card text-foreground border-border",
        },
      }}
    />
  );
}

export { Toaster };
