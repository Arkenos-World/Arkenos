export function SafetySection() {
  return (
    <section className="py-32 md:py-48 bg-white border-t border-black/5 w-full">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-20 md:mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-50 border border-black/5 text-[13px] font-medium text-zinc-600 mb-6 shadow-sm">
            Trust & Safety
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-zinc-900 leading-[1.1]">
            Safety, built in.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Moderation", desc: "We actively monitor content generated with our technology to ensure safe interactions.", icon: "◿" },
            { title: "Accountability", desc: "We believe misuse must have consequences, enforcing strict usage policies.", icon: "▦" },
            { title: "Provenance", desc: "We believe that you should always know if audio is AI-generated.", icon: "◎" },
          ].map((item) => (
            <div key={item.title} className="bg-stone-50 rounded-[2rem] p-10 md:p-12 border border-black/5 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all duration-500 hover:-translate-y-1">
              <div className="text-7xl font-thin text-zinc-200 mb-10 group-hover:text-zinc-900 transition-colors duration-500">{item.icon}</div>
              <h3 className="text-xl font-medium mb-4 text-zinc-900">{item.title}</h3>
              <p className="text-[15px] text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}