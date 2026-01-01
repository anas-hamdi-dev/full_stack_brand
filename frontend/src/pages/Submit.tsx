import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import BrandSubmissionDialog from "@/components/BrandSubmissionDialog";
import { Button } from "@/components/ui/button";

const Submit = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Submit Your <span className="text-gradient-primary">Brand</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Join Tunisia's premier fashion directory and get discovered by thousands of fashion enthusiasts.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">Why List Your Brand?</h2>
              <div className="space-y-6">
                {[
                  { title: "Increased Visibility", description: "Get discovered by thousands of fashion enthusiasts browsing our platform daily." },
                  { title: "Direct Traffic", description: "Customers click directly through to your official website or store." },
                  { title: "Free Listing", description: "Basic listings are completely free. No hidden costs or fees." },
                  { title: "Verified Badge", description: "Verified brands get a special badge that builds customer trust." },
                  { title: "Category Features", description: "Get featured in your category and reach your target audience." },
                  { title: "Community Support", description: "Join a community of Tunisian fashion brands supporting each other." },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="glass rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                <span className="font-display text-3xl font-bold text-primary-foreground">M</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Fill out our simple form and our team will review your submission within 24-48 hours.
              </p>
              <BrandSubmissionDialog 
                trigger={
                  <Button variant="hero" size="xl">
                    Submit Your Brand
                  </Button>
                }
              />
              <p className="text-sm text-muted-foreground mt-6">
                Free • No credit card required • Quick approval
              </p>
            </div>
          </div>

          {/* Process */}
          <div className="mt-20">
            <h2 className="font-display text-2xl font-bold text-foreground mb-12 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Submit Your Info", description: "Fill out the form with your brand details, category, and contact information." },
                { step: "2", title: "We Review", description: "Our team reviews your submission to ensure quality and authenticity." },
                { step: "3", title: "Go Live", description: "Once approved, your brand goes live and starts getting discovered." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <span className="font-display text-2xl font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Submit;
