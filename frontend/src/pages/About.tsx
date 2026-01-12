import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Users, Target, Heart, Globe } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Helmet } from "react-helmet";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About - el mall - Discover All Tunisian Brands</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </Helmet>
      <div className="min-h-screen bg-background pt-20 pb-20">
        <main className="pb-16">
          <div className="container mx-auto px-4">
            
            {/* Header */}
            <div className="mb-16">
              <div className="mb-6">
                <BackButton to="/" label="Back to Home" />
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                About <span className="text-gradient-primary">Elmall</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg">
                Elmall brings Tunisian clothing brands together in one place, making it easy for people to discover, explore, and support local fashion.
              </p>
            </div>

            {/* What We Do */}
            <div className="mb-20">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                We make discovering Tunisian brands simple. Whether you're a fashion lover or a brand owner, Elmall connects you with the best of Tunisian style.
              </p>
            </div>

            {/* Values */}
            <div className="mb-20">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
               
              {[
  { 
    icon: Heart, 
    title: "Passion", 
    description: "We love consuming 100% Tounsi." 
  },
  { 
    icon: Users, 
    title: "Community", 
    description: "Connecting brands and fans." 
  },
  { 
    icon: Target, 
    title: "Support", 
    description: "Helping local brands grow." 
  },
  { 
    icon: Globe, 
    title: "Reach", 
    description: "Showcasing Tunisian brands  everywhere." 
  },
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

            {/* Call to Action */}
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Join Our Mission</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Whether you're a fashion brand or a style enthusiast, be part of our growing community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/contact">
                  <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all">
                    Contact Us
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
