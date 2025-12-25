import React from "react";
import { Github, Twitter, Linkedin, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-black/20 backdrop-blur-sm py-8 mt-auto">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Brand & Copyright */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="text-sm font-semibold text-zinc-300 tracking-wide">
                        SonicFlow
                    </span>
                    <p className="text-xs text-zinc-500">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>

                {/* Links */}
                <div className="flex items-center gap-6">
                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                        <Github className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                        <Twitter className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                        <Linkedin className="w-4 h-4" />
                    </a>
                </div>

                {/* Made with */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>Made with</span>
                    <Heart className="w-3 h-3 text-red-500 fill-red-500/20" />
                    <span>by Antigravity</span>
                </div>
            </div>
        </footer>
    );
}
