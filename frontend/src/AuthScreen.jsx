import React, { useState } from "react";

export default function AuthScreen({ mode, onModeChange, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try { await onSubmit({ name, email, password }); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Could not sign in."); }
    finally { setSaving(false); }
  }

  return <main className="auth-screen"><section className="auth-panel"><span className="eyebrow">YOUR KITCHEN, YOUR COLLECTION</span><h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1><p className="auth-intro">Sign in to save recipes, personalize meal plans, and receive notifications.</p><div className="auth-tabs"><button className={mode === "login" ? "auth-tab-active" : ""} onClick={() => onModeChange("login")}>Sign in</button><button className={mode === "register" ? "auth-tab-active" : ""} onClick={() => onModeChange("register")}>Create account</button></div><form className="auth-form" onSubmit={submit}>{mode === "register" && <label className="auth-field">Name<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label className="auth-field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="auth-field">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={saving}>{saving ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button></form></section></main>;
}
