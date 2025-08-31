import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting deadline reminder process...");

    // Get all users with 'partner' role
    const { data: partners, error: partnersError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('role', 'partner');

    if (partnersError) {
      console.error("Error fetching partners:", partnersError);
      throw new Error(`Failed to fetch partners: ${partnersError.message}`);
    }

    if (!partners || partners.length === 0) {
      console.log("No partners found");
      return new Response(
        JSON.stringify({ message: "No local partners found to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${partners.length} partners to notify`);

    // Get user emails from auth.users table
    const userIds = partners.map(p => p.user_id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw new Error(`Failed to fetch user emails: ${authError.message}`);
    }

    // Filter to get partner emails
    const partnerEmails = authUsers.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({
        email: user.email,
        name: partners.find(p => p.user_id === user.id)?.full_name || user.email
      }));

    console.log(`Sending emails to ${partnerEmails.length} partners`);

    // Calculate deadline information
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    
    // Deadline is the 10th of current month
    const deadlineDate = new Date(currentYear, currentMonth, 10);
    const isAfterDeadline = currentDay > 10;
    const nextDeadlineDate = new Date(currentYear, currentMonth + 1, 10);
    const relevantDeadline = isAfterDeadline ? nextDeadlineDate : deadlineDate;
    
    const daysUntilDeadline = Math.ceil((relevantDeadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Send emails to all partners
    const emailPromises = partnerEmails.map(async ({ email, name }) => {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Submission Deadline Reminder</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .deadline-box { background: ${isAfterDeadline ? '#dc3545' : daysUntilDeadline <= 5 ? '#ffc107' : '#007bff'}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SafeGuard Submission Reminder</h1>
              </div>
              <div class="content">
                <p>Dear ${name},</p>
                
                <p>This is a friendly reminder about the monthly data submission deadline for SafeGuard.</p>
                
                <div class="deadline-box">
                  <h2>Submission Deadline</h2>
                  <p><strong>${relevantDeadline.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong></p>
                  ${isAfterDeadline ? 
                    '<p>The deadline for this month has passed. Please ensure your submission is ready for the next deadline.</p>' :
                    daysUntilDeadline === 0 ? 
                      '<p><strong>Today is the deadline!</strong> Please submit your data today.</p>' :
                      `<p><strong>${daysUntilDeadline} days remaining</strong></p>`
                  }
                </div>
                
                <p>Please ensure you submit your humanitarian impact data through the SafeGuard platform by the deadline. This includes:</p>
                <ul>
                  <li>Monthly activity reports</li>
                  <li>Impact metrics and numbers</li>
                  <li>Supporting documentation</li>
                  <li>Photo evidence where applicable</li>
                </ul>
                
                <p>If you have any questions or need assistance with your submission, please don't hesitate to contact the administrative team.</p>
                
                <p>Thank you for your continued partnership and commitment to our mission.</p>
                
                <p>Best regards,<br>
                The SafeGuard Administrative Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message from the SafeGuard platform.</p>
              </div>
            </body>
          </html>
        `;

        const result = await resend.emails.send({
          from: "SafeGuard Admin <onboarding@resend.dev>",
          to: [email],
          subject: `Submission Deadline Reminder - ${relevantDeadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
          html: emailHtml,
        });

        console.log(`Email sent successfully to ${email}:`, result);
        return { email, success: true, id: result.data?.id };
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Email sending completed: ${successful.length} successful, ${failed.length} failed`);

    return new Response(
      JSON.stringify({
        message: "Deadline reminders sent",
        details: {
          total: partnerEmails.length,
          successful: successful.length,
          failed: failed.length,
          results: results
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-deadline-reminder function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send deadline reminders"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);