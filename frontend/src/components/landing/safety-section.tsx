export function SafetySection() {
  return (
    <section className="py-48 bg-white dark:bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl sm:text-6xl font-medium tracking-tight mb-32 text-center text-foreground">Safety, built in</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { title: "Moderation", desc: "We actively monitor content generated with our technology.", icon: "◿" },
            { title: "Accountability", desc: "We believe misuse must have consequences.", icon: "▦" },
            { title: "Provenance", desc: "We believe that you should know if audio is AI-generated.", icon: "◎" },
          ].map((item) => (
            <div key={item.title} className="bg-stone-50 dark:bg-stone-900/50 rounded-[2.5rem] p-12 border border-border/20 flex flex-col items-center text-center group hover:bg-stone-100 dark:hover:bg-stone-900 transition-all duration-500">
              <div className="text-8xl font-thin text-muted-foreground/20 mb-16 group-hover:text-foreground/40 transition-colors">{item.icon}</div>
              <h3 className="text-2xl font-medium mb-6 text-foreground">{item.title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}