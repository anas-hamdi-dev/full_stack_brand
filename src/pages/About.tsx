import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Users, Target, Heart, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-16">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="text-gradient-primary">el mall</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              We're on a mission to showcase the best of Tunisian fashion to the world.
            </p>
          </div>

          {/* Story Section */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  el mall was born from a simple observation: Tunisia has an incredible 
                  fashion scene that deserves more visibility. From the bustling souks of Tunis 
                  to the modern boutiques of La Marsa, our country is home to talented designers 
                  and passionate entrepreneurs.
                </p>
                <p>
                  We created this platform to bridge the gap between these amazing local brands 
                  and fashion enthusiasts looking for authentic, quality pieces. Whether you're 
                  searching for traditional craftsmanship or contemporary streetwear, el mall 
                  is your gateway to discovering the best of Tunisian style.
                </p>
                <p>
                  Our team carefully curates and verifies each brand to ensure you're connecting 
                  with legitimate, quality-focused fashion creators who represent the best of 
                  what Tunisia has to offer.
                </p>
              </div>
            </div>
            <div className="glass rounded-3xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-6xl font-bold text-gradient-primary mb-2">50+</div>
                <p className="text-muted-foreground">Verified Brands</p>
                <div className="mt-8 font-display text-4xl font-bold text-gradient-secondary mb-2">8</div>
                <p className="text-muted-foreground">Fashion Categories</p>
                <div className="mt-8 font-display text-4xl font-bold text-foreground mb-2">24</div>
                <p className="text-muted-foreground">Governorates Covered</p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Heart, title: "Passion", description: "We're driven by our love for Tunisian fashion and culture" },
                { icon: Users, title: "Community", description: "Building connections between brands and fashion lovers" },
                { icon: Target, title: "Quality", description: "Only verified, quality brands make it to our platform" },
                { icon: Globe, title: "Visibility", description: "Putting Tunisian fashion on the global map" },
              ].map((value) => (
                <div key={value.title} className="glass rounded-2xl p-6 text-center hover-lift">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Join Our Mission</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Whether you're a fashion brand looking to grow or an enthusiast wanting to discover 
              authentic Tunisian style, we'd love to have you as part of our community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/submit">
                <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all">
                  Submit Your Brand
                </button>
              </Link>
              <Link to="/contact">
                <button className="glass px-8 py-3 rounded-xl font-semibold text-foreground hover:bg-muted transition-all">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
