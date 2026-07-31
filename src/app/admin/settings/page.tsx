export default function AdminSettingsPage() {
  return (
    <section className="admin-main">
      <h1>Settings</h1>
      <p className="admin-subtitle">School and platform configuration</p>

      <div className="admin-content-panel">
        <h2>School Profile</h2>
        <p>Institution name, term dates, and grading scale.</p>
      </div>

      <div className="admin-content-panel">
        <h2>Roles &amp; Permissions</h2>
        <p>Manage what admins, faculty, and students can access.</p>
      </div>
    </section>
  );
}
