import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="px-6 pb-12 pt-8 bg-brand-bg">
      <div className="max-w-7xl mx-auto bg-brand-clay rounded-[2.5rem] p-12 md:p-20 text-center space-y-8">
        <h2 className="font-display text-4xl md:text-6xl max-w-3xl mx-auto text-brand-navy leading-[1.05]">
          Your future in tech starts right here.
        </h2>
        <div className="flex justify-center">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="px-10 py-5 bg-brand-navy text-white rounded-full font-bold text-lg hover:scale-[1.02] transition-transform"
          >
            Join Pioneer Africa Hub
          </Link>
        </div>
        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-brand-navy/10">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-brand-navy rounded flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-display font-bold text-brand-navy">Pioneer Africa Hub</span>
          </div>
          <div className="text-sm text-brand-navy/40">© {new Date().getFullYear()} Pioneer Africa Hub. All rights reserved.</div>
          <div className="flex gap-6 text-sm font-bold text-brand-navy">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
