"use client";

import { motion } from "framer-motion";
import { Globe, Terminal, Network, PhoneCall, Server, PhoneForwarded, Activity, ShieldCheck } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  },
};

export function TelephonySection() {
  return (
    <section className="bg-white py-24 md:py-32 border-t border-black/5 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Editorial Header */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-50 border border-black/5 text-[13px] font-medium text-zinc-600 mb-6 shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              Global Edge Network
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium leading-[1.1] text-zinc-900 tracking-tight">
              Enterprise telephony.<br className="hidden md:block" />
              Ready for production.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:pt-16"
          >
            <p className="text-lg text-zinc-500 leading-relaxed max-w-lg mb-8">
              Connect via SIP trunking to your existing infrastructure or provision numbers directly. Built on LiveKit to handle thousands of concurrent connections with ultra-low latency.
            </p>
            
            {/* Quick Feature List */}
            <div className="flex flex-col gap-4 border-l border-black/10 pl-6">
              <div>
                <h3 className="text-[14px] font-medium text-zinc-900 mb-1">Warm Transfers</h3>
                <p className="text-[13px] text-zinc-500">Agents can summarize context and bridge calls to humans.</p>
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-zinc-900 mb-1">Sub-50ms Latency</h3>
                <p className="text-[13px] text-zinc-500">Direct SIP to WebRTC bridging across global edge nodes.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* The Outer Canvas (Warm Stone) */}
        <div className="w-full bg-stone-50 rounded-[2.5rem] p-6 md:p-10 lg:p-12 border border-black/5 relative">
          
          {/* The Unified Demo Surface (Crisp White Card) */}
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
            
            {/* Demo Header Bar */}
            <div className="h-14 border-b border-black/5 bg-white flex items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                </div>
                <div className="w-px h-4 bg-zinc-200 ml-2" />
                <div className="flex items-center gap-2 ml-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-[13px] font-medium text-zinc-600">network_routing</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Connected</span>
              </div>
            </div>

            {/* Demo Body */}
            <div className="flex flex-col lg:flex-row">
              
              {/* Left Pane: Call Trace */}
              <div className="flex-1 p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-black/5">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" />
                  Call Routing Trace
                </div>

                <div className="relative">
                  
                  {/* Step 1: Inbound Call */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative pl-10 pb-8">
                    <div className="absolute left-[11px] top-7 bottom-[-1rem] w-px bg-zinc-100" />
                    
                    {/* Ringing Avatar/Icon */}
                    <div className="absolute left-0 top-1 flex items-center justify-center w-6 h-6">
                      <motion.div 
                        animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-blue-500/30"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-blue-500/20"
                      />
                      <div className="relative w-full h-full flex items-center justify-center bg-white border border-blue-200 rounded-full shadow-sm text-blue-500 z-10">
                        <PhoneCall className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 mb-1">INBOUND_CALL</div>
                    <div className="text-[15px] font-medium text-zinc-900 leading-relaxed">
                      +1 (415) 555-0198
                    </div>
                  </motion.div>

                  {/* Step 2: Edge Ingestion */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative pl-10 pb-8">
                    <div className="absolute left-[11px] top-7 bottom-[-1rem] w-px bg-zinc-100" />
                    
                    <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center">
                      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900 border border-zinc-900 rounded-full shadow-sm text-white">
                        <Server className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center gap-2">
                      EDGE_INGESTION
                      <div className="flex items-center gap-1 ml-1">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                            className="w-1 h-1 rounded-full bg-zinc-400"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[14px] text-zinc-500 leading-relaxed">
                      Routing via <span className="text-zinc-700 font-medium">us-east-1</span> edge node. Bridging SIP to WebRTC stream.
                    </div>
                  </motion.div>

                  {/* Step 3: Agent Connected */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="relative pl-10 pb-8">
                    <div className="absolute left-[11px] top-7 bottom-[-1rem] w-px bg-zinc-100" />
                    <div className="absolute left-0 top-1 flex items-center justify-center w-6 h-6 bg-white border border-zinc-200 rounded-full shadow-sm text-zinc-500">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center gap-2">
                      AGENT_CONNECTED
                      <div className="flex items-end gap-[2px] h-3 ml-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                            className="w-[2px] h-full bg-zinc-300 origin-bottom rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-zinc-300 ml-1">•</span> 42ms
                    </div>
                    <div className="text-[15px] font-medium text-zinc-900 leading-relaxed">
                      "Hello! Thanks for calling Arkenos support. How can I help?"
                    </div>
                  </motion.div>

                  {/* Step 4: Warm Transfer */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-blue-500/30 border-dashed"
                      />
                      <div className="relative w-full h-full flex items-center justify-center bg-white border border-blue-200 rounded-full shadow-sm text-blue-500">
                        <PhoneForwarded className="w-3 h-3" />
                      </div>
                    </div>
                    
                    <div className="text-[11px] font-mono text-blue-500 mb-2 flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                      </span>
                      WARM_TRANSFER_INITIATED
                    </div>

                    <div className="bg-white border border-black/5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden max-w-md mt-3">
                      <div className="bg-stone-50/50 border-b border-black/5 px-3 py-2.5 flex items-center justify-between">
                        <span className="text-[12px] font-mono text-zinc-700 flex items-center gap-1.5">
                          dial_human_agent
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono border border-blue-100">
                          DIALING...
                        </div>
                      </div>
                      <div className="p-3 overflow-x-auto bg-white">
                        <pre className="text-[12px] font-mono text-zinc-500 leading-relaxed">
{`{
  "destination": "+1 (800) 555-9000",
  "context_summary": "User needs help resetting API key.",
  "barge_in": false
}`}
                        </pre>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>

              {/* Right Pane: Connection State */}
              <div className="w-full lg:w-[320px] xl:w-[380px] bg-stone-50/50 border-t lg:border-t-0 flex flex-col relative">
                
                {/* Decorative Right Pane Header */}
                <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-white/50">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    Connection State
                  </div>
                </div>

                {/* Inspector Body */}
                <div className="p-6 space-y-8 flex-1">
                  
                  {/* Block 1: Call Details */}
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 ml-1">Call Details</div>
                    <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
                        <span className="text-[13px] text-zinc-500">call_id</span>
                        <span className="text-[13px] font-mono text-zinc-900">cl_098bx</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
                        <span className="text-[13px] text-zinc-500">duration</span>
                        <span className="text-[13px] font-mono text-zinc-900">02:14</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-[13px] text-zinc-500">direction</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                          Inbound
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Network Telemetry */}
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 ml-1">Edge Telemetry</div>
                    <div className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
                        <span className="text-[13px] text-zinc-500">SIP Trunk</span>
                        <span className="text-[13px] font-medium text-zinc-900">Twilio (US-East)</span>
                      </div>
                      
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
                        <span className="text-[13px] text-zinc-500">RTC Gateway</span>
                        <span className="text-[13px] font-medium text-zinc-900">LiveKit Edge</span>
                      </div>

                      {/* Dynamic Highlight Row */}
                      <motion.div 
                        initial={{ backgroundColor: "rgba(255,255,255,1)" }}
                        whileInView={{ backgroundColor: "rgba(239,246,255,1)" }} // blue-50
                        viewport={{ once: true }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="flex flex-col gap-1 px-3 py-2.5 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[13px] font-medium text-blue-700">Audio Latency</span>
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              Optimal
                            </span>
                          </div>
                        </div>
                        <span className="text-[13px] font-mono text-blue-900 mt-0.5 relative z-10">
                          42ms (Jitter: 3ms)
                        </span>
                        
                        {/* Shimmer sweep effect */}
                        <motion.div 
                          initial={{ left: "-100%" }}
                          whileInView={{ left: "200%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-100 to-transparent skew-x-12 z-0"
                        />
                      </motion.div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

