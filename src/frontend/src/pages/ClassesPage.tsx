import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Loader2, LogOut, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClassInfo } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateClass, useListClasses } from "../hooks/useQueries";

interface ClassesPageProps {
  onSelectClass: (cls: ClassInfo) => void;
}

export default function ClassesPage({ onSelectClass }: ClassesPageProps) {
  const { clear } = useInternetIdentity();
  const classesQuery = useListClasses();
  const createClass = useCreateClass();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;

    try {
      await createClass.mutateAsync(name);
      setNewClassName("");
      setShowAddForm(false);
      toast.success("Klas aangemaakt");
    } catch {
      toast.error("Er ging iets mis bij aanmaken");
    }
  };

  const classes = classesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-display font-black">
              S
            </span>
          </div>
          <span className="font-display font-bold text-xl">SchoolApp</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={clear}
            variant="ghost"
            size="sm"
            className="h-11 px-3 text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-base"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground">
            Mijn Klassen
          </h1>
          <Button
            data-ocid="classes.add_button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-12 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base gap-2"
          >
            <Plus className="h-5 w-5" />
            Nieuwe klas
          </Button>
        </div>

        {/* Add class form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <form
                onSubmit={(e) => void handleAddClass(e)}
                className="bg-card border border-border rounded-2xl p-5 flex gap-3"
              >
                <Input
                  type="text"
                  placeholder="Naam van de klas (bijv. Klas 1A)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 h-14 text-lg rounded-xl"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={createClass.isPending || !newClassName.trim()}
                  className="h-14 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-lg shrink-0"
                >
                  {createClass.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Aanmaken"
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Classes grid */}
        {classesQuery.isLoading ? (
          <div
            data-ocid="classes.loading_state"
            className="grid grid-cols-2 gap-4"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div
            data-ocid="classes.empty_state"
            className="text-center py-16 text-muted-foreground"
          >
            <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-semibold mb-2">Nog geen klassen</p>
            <p className="text-base">
              Druk op &quot;Nieuwe klas&quot; om te beginnen.
            </p>
          </div>
        ) : (
          <div data-ocid="classes.list" className="grid grid-cols-2 gap-4">
            {classes.map((cls, idx) => (
              <motion.div
                key={cls.id.toString()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
              >
                <button
                  type="button"
                  data-ocid={`class.item.${idx + 1}`}
                  onClick={() => onSelectClass(cls)}
                  className="w-full h-28 bg-card border-2 border-border hover:border-primary hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm group"
                >
                  <BookOpen className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-display font-bold text-lg text-foreground text-center px-2 leading-tight">
                    {cls.name}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-muted-foreground text-sm">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Gebouwd met ❤️ via caffeine.ai
        </a>
      </footer>
    </div>
  );
}
