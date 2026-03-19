import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Star, FileText, Store, ArrowRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">RoomieSearch</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login"><Button variant="ghost">Log in</Button></Link>
          <Link href="/signup"><Button>Get started</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4">Now in beta — free to use</Badge>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Find your next apartment,<br />
          <span className="text-indigo-600">together.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          RoomieSearch is the collaborative apartment hunting platform for groups of roommates. Share listings, rate together, apply as a team.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup"><Button size="lg" className="gap-2">Start searching free <ArrowRight className="w-4 h-4" /></Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">Log in</Button></Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything your group needs</h2>
          <p className="text-center text-gray-500 mb-12">From finding listings to submitting applications, all in one place.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Smart Listing Import", desc: "Paste any Zillow, Apartments.com, or Craigslist URL and we auto-extract all the details." },
              { icon: Star, title: "Group Ratings", desc: "Every member rates each listing 1–5 stars. See average scores and rank by group preference." },
              { icon: Users, title: "Roommate Groups", desc: "Create a group, set preferences, invite your friends via link. Collaborate in real-time." },
              { icon: Search, title: "AI Suggestions", desc: "Let our AI agent find listings that match your group's budget, location, and size preferences." },
              { icon: FileText, title: "Application Packets", desc: "Generate a combined PDF application with all roommates' info, employment, and financials." },
              { icon: Store, title: "Roommate Marketplace", desc: "Find groups with open rooms or individuals looking for roommates in your city." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
        <div className="space-y-8">
          {[
            { step: "1", title: "Create or join a group", desc: "Sign up, create a roommate group, and invite your future roommates via a shareable link." },
            { step: "2", title: "Add apartment listings", desc: "Paste listing URLs from any site. We scrape the details automatically, or you can enter them manually." },
            { step: "3", title: "Rate & discuss together", desc: "Each member rates listings 1–5 stars and leaves comments. The board automatically ranks by group preference." },
            { step: "4", title: "Apply as a team", desc: "Mark your favorite, fill in your application info, and generate a combined PDF packet to send to the landlord." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">{step}</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{title}</h3>
                <p className="text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-indigo-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to find your place?</h2>
        <p className="text-indigo-200 mb-8 text-lg">Join hundreds of roommate groups already using RoomieSearch.</p>
        <Link href="/signup"><Button size="lg" variant="secondary" className="gap-2">Create your group <ArrowRight className="w-4 h-4" /></Button></Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-gray-400 text-sm">
        <p>© 2024 RoomieSearch. Built for roommates, by roommates.</p>
      </footer>
    </div>
  );
}
