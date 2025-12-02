import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SearchIcon, Building2Icon, PackageIcon, CheckCircle2Icon, ShieldCheckIcon, CreditCardIcon, BellIcon } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">saline.co.ke</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <Link to="/login"><Button variant="ghost">Sign In</Button></Link>
            <Link to="/signup"><Button>Get Started</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">
              Connect Hospitals with Medical Suppliers
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Kenya's premier B2B marketplace for medical equipment and supplies. Submit RFQs, receive competitive quotes, and connect with verified suppliers.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for medical equipment, supplies, pharmaceuticals..." 
                className="pl-12 pr-4 py-6 text-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Can't find what you need? Create a custom RFQ
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Verified Suppliers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">1,000+</div>
              <div className="text-sm text-muted-foreground">Products Listed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Free for Hospitals</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple, fast, and secure procurement process</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Hospitals */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2Icon className="h-8 w-8 text-primary" />
                <h3 className="text-2xl font-bold">For Hospitals</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Search or Create RFQ</h4>
                    <p className="text-sm text-muted-foreground">Find products or submit custom requests</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Receive Quotations</h4>
                    <p className="text-sm text-muted-foreground">Get competitive quotes from verified suppliers</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Approve & Connect</h4>
                    <p className="text-sm text-muted-foreground">Review quotes and connect with your preferred supplier</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Suppliers */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <PackageIcon className="h-8 w-8 text-primary" />
                <h3 className="text-2xl font-bold">For Suppliers</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Receive RFQ Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get instant alerts for relevant opportunities</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Submit Quotations</h4>
                    <p className="text-sm text-muted-foreground">Open RFQs with credits and submit competitive quotes</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Win Business</h4>
                    <p className="text-sm text-muted-foreground">When approved, unlock contact details and close deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Saline</h2>
            <p className="text-lg text-muted-foreground">Built for the medical supply industry</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Verified Suppliers</h3>
              <p className="text-muted-foreground">All suppliers verified with CR12 documentation</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Credit-Based System</h3>
              <p className="text-muted-foreground">Fair pay-per-opportunity model for suppliers</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BellIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Real-Time Notifications</h3>
              <p className="text-muted-foreground">Stay updated via email, WhatsApp, and in-app alerts</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Auto-Quotations</h3>
              <p className="text-muted-foreground">Smart matching generates quotes from supplier catalogs</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Hospital Teams</h3>
              <p className="text-muted-foreground">Multiple staff members per hospital account</p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <SearchIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Smart Search</h3>
              <p className="text-muted-foreground">Quickly find exactly what you need</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl opacity-90">Join hundreds of hospitals and suppliers already using saline.co.ke</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/signup?type=hospital">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Sign Up as Hospital
              </Button>
            </Link>
            <Link to="/signup?type=supplier">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Sign Up as Supplier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">saline.co.ke</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Kenya's premier B2B marketplace for medical supplies
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Create RFQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Search Products</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Suppliers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">View RFQs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Buy Credits</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Important:</strong> saline.co.ke only facilitates connection between hospitals and suppliers. It does not handle payments, deliveries, or contractual obligations.
              </p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © 2024 saline.co.ke. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
