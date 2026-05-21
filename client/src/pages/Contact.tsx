import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Mail, Phone, User, MessageSquare, Paperclip, X, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setAttachmentUrl(response.objectPath);
      setAttachmentName(response.metadata.name);
      toast({
        title: "File uploaded",
        description: "Your attachment has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName(null);
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/contact", {
        ...data,
        attachmentUrl,
      });

      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      form.reset();
      setAttachmentUrl(null);
      setAttachmentName(null);
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#202020] mb-6 text-center">
              Contact Us
            </h1>
            <p className="text-lg text-[#666666] text-center max-w-2xl mx-auto">
              Have questions, concerns, or verification inquiries? We'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#666666]" />
                          First Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            data-testid="input-contact-firstname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#666666]" />
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                            data-testid="input-contact-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#666666]" />
                          Phone <span className="text-[#999999] text-sm">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#666666]" />
                          Message <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us how we can help you..."
                            className="min-h-[150px] resize-none"
                            {...field}
                            data-testid="input-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Paperclip className="w-4 h-4 text-[#666666]" />
                      Attachment <span className="text-[#999999] text-sm">(optional)</span>
                    </label>

                    {attachmentName ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-[#444444] truncate max-w-[200px]">{attachmentName}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeAttachment}
                          className="h-8 w-8"
                          data-testid="button-remove-attachment"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          data-testid="input-contact-attachment"
                        />
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm text-[#666666]">Uploading... {progress}%</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Paperclip className="w-8 h-8 text-[#999999]" />
                              <span className="text-sm text-[#666666]">Click to upload or drag and drop</span>
                              <span className="text-xs text-[#999999]">PDF, JPG, PNG, WEBP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#F5C518] text-[#111111] font-bold py-6"
                    disabled={isSubmitting || isUploading}
                    data-testid="button-contact-submit"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
