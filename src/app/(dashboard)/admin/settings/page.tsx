export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">Settings</h1><p className="text-muted-foreground text-sm">System configuration and preferences</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "General", desc: "Hospital name, address, emergency contact" },
          { title: "Email / SMTP", desc: "Configure email sending for notifications" },
          { title: "Security", desc: "Session timeout, password policies" },
          { title: "System", desc: "Cache management, data export" },
        ].map(s => (
          <div key={s.title} className="hosapp-card p-5">
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
            <p className="text-xs text-muted-foreground mt-3 italic">Configuration coming soon.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
