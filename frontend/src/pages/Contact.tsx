import PageLayout from "@/components/PageLayout";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { contactMessagesApi } from "@/lib/api";
import BackButton from "@/components/BackButton";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactMessagesApi.create(formData);
      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageLayout>
        <main className="pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <BackButton to="/" label="Back to Home" />
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4">
                Get in <span className="text-gradient-primary">Touch</span>
              </h1>
              <p className="mt-2 text-muted-foreground max-w-xl">
                We'd love to hear from you! Fill out the form or reach us directly through our contact info.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="glass rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Name
                      </label>
                      <Input
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Subject
                    </label>
                    <Input
                      placeholder="Message Subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Message
                    </label>
                    <Textarea
                      rows={5}
                      placeholder="Write your message..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="glass rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Contact Information
                  </h2>
                  <div className="space-y-5">
                    <ContactItem
                      icon={<Mail className="w-6 h-6 text-white" />}
                      title="Email"
                      value="contact@elmall.tn"
                      gradient="bg-gradient-primary"
                    />
                    <ContactItem
                      icon={<Phone className="w-6 h-6 text-white" />}
                      title="Phone"
                      value="+216 99 797 459"
                      gradient="bg-gradient-secondary"
                    />
                    <ContactItem
                      icon={<MapPin className="w-6 h-6 text-white" />}
                      title="Location"
                      value="Bizerte, Tunisia"
                      gradient="bg-gradient-secondary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </PageLayout>
    </div>
  );
};

const ContactItem = ({
  icon,
  title,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  gradient: string;
}) => (
  <div className="flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{value}</p>
    </div>
  </div>
);

export default Contact;
