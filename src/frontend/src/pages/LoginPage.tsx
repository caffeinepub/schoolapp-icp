import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError, isInitializing } =
    useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Header brand strip */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground text-2xl font-display font-black">
              S
            </span>
          </div>
          <span className="font-display font-bold text-3xl tracking-tight text-foreground">
            SchoolApp
          </span>
        </div>
        <p className="text-muted-foreground text-lg">
          Klassen · Presentie · Cijfers
        </p>
      </motion.div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Inloggen
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Gebruik je vingerafdruk of gezichtsscan. Geen wachtwoord nodig.
          </p>
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn || isInitializing}
          className="w-full h-16 text-xl font-display font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md transition-all active:scale-98"
          size="lg"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Bezig met inloggen…
            </>
          ) : isInitializing ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Laden…
            </>
          ) : (
            <>
              <Fingerprint className="mr-3 h-6 w-6" />
              Inloggen via Internet Identity
            </>
          )}
        </Button>

        {isLoginError && (
          <div
            data-ocid="login.error_state"
            className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-base text-center"
          >
            {loginError?.message ?? "Inloggen mislukt. Probeer opnieuw."}
          </div>
        )}

        <p className="text-center text-muted-foreground text-sm mt-6">
          Beveiligd door het Internet Computer Protocol
        </p>
      </motion.div>

      {/* Footer */}
      <p className="mt-12 text-muted-foreground text-sm">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Gebouwd met ❤️ via caffeine.ai
        </a>
      </p>
    </div>
  );
}
