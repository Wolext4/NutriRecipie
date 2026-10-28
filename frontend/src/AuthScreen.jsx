import React, { useState } from "react";
import { ChefHat, ChevronRight, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function AuthScreen({ mode, onModeChange, onSubmit, onGuest }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const registering = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn't sign you in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-screen">
      <a className="app-logo auth-logo" href="#" onClick={(event) => event.preventDefault()}>
        <span className="logo-mark"><ChefHat size={20} /></span>
        NutriRecipie
      </a>
      <section className="auth-panel">
        <span className="eyebrow">YOUR KITCHEN, YOUR COLLECTION</span>
        <h1>{registering ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-intro">
          {registering
            ? "Sign up to save and manage your own recipes."
            : "Sign in to find your recipes and pick up where you left off."}
        </p>
        <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button type="button" role="tab" aria-selected={!registering} className={!registering ? "auth-tab-active" : ""} onClick={() => { setError(""); onModeChange("login"); }}>Sign in</button>
          <button type="button" role="tab" aria-selected={registering} className={registering ? "auth-tab-active" : ""} onClick={() => { setError(""); onModeChange("register"); }}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {registering && (
            <label className="auth-field">
              <span>Name</span>
              <span className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></span>
            </label>
          )}
          <label className="auth-field">
            <span>Email</span>
            <span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
          </label>
          <label className="auth-field">
            <span>Password</span>
            <span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registering ? "At least 8 characters" : "Your password"} /></span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={saving}>{saving ? "Please wait…" : registering ? "Create account" : "Sign in"} <ChevronRight size={17} /></button>
        </form>
        <div className="auth-divider"><span />OR<span /></div>
        <button type="button" className="auth-guest" onClick={onGuest}>Browse public recipes as a guest</button>
        <p className="auth-note">Public starter recipes are available without an account. Sign in to create your private collection.</p>
      </section>
    </main>
  );
}
