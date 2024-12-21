const { ObjectId, MongoClient } = require("mongodb");
const sgMail = require("@sendgrid/mail");
const cron = require("node-cron");
const MasterPrompt = require("./MasterPrompt");
const dotenv = require("dotenv");
const {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} = require("@google/generative-ai");
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);
const model = genAI.getGenerativeModel(
  {
    model: "models/gemini-1.5-pro-002",
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7,
          },
        },
      },
    ],
  },
  { apiVersion: "v1beta" }
);

class EmailScheduler {
  constructor() {
    this.mongoUri = process.env.MONGOOSE;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    this.initialize();
  }

  async initialize() {
    console.log(MasterPrompt);
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db("PGenMail");
      this.emailTasks = this.db.collection("users");
      this.cronJob = null; // Cron job reference

      // Create index for efficient querying
      await this.emailTasks.createIndex({ send_time: 1 });
      await this.emailTasks.createIndex({ last_sent: 1 });

      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async addDailyEmail(email, prompt, sendTime) {
    // Validate time format (HH:mm)
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sendTime)) {
      throw new Error(
        "Invalid time format. Please use HH:mm format (e.g., 09:30)"
      );
    }

    try {
      const result = await this.emailTasks.insertOne({
        email,
        prompt,
        send_time: sendTime,
        last_sent: null,
        active: true,
        created_at: new Date(),
      });
      console.log(`Added new daily email task with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      console.error("Failed to add daily email task:", error);
      throw error;
    }
  }
  async GenerateEmail(prompt) {
    console.log("generating email");
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return result.response.text();
  }

  async sendEmail(toEmail, prompt) {
    const generatedEmail = MasterPrompt; //await this.GenerateEmail(MasterPrompt + prompt);
    const msg = {
      to: toEmail,
      from: process.env.SENDER_EMAIL, // Verified sender email
      subject: "PGen Mail Your Daily Feed",
      content: [
        {
          type: "text/html",
          value: generatedEmail,
        },
      ],
    };

    try {
      await sgMail.send(msg);
      console.log("Email sent successfully to:", toEmail);
      return true;
    } catch (error) {
      console.error("SendGrid error:", error);
      if (error.response) {
        console.error("SendGrid error details:", error.response.body);
      }
      return false;
    }
  }

  async checkAndSendDailyEmails() {
    try {
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      const currentDate = new Date().toISOString().split("T")[0];
      console.log(currentTime);
      // Find all active emails scheduled for current time that haven't been sent today
      const tasks = await this.emailTasks
        .find({
          send_time: currentTime,
          active: true,
          $or: [
            { last_sent: null },
            { last_sent: { $lt: new Date(currentDate) } },
          ],
        })
        .toArray();

      for (const task of tasks) {
        if (await this.sendEmail(task.email, task.prompt)) {
          await this.emailTasks.updateOne(
            { _id: task._id },
            {
              $set: {
                last_sent: new Date(),
                last_success: new Date(),
              },
            }
          );
        } else {
          // Update last attempt and error count
          await this.emailTasks.updateOne(
            { _id: task._id },
            {
              $set: { last_attempt: new Date() },
              $inc: { error_count: 1 },
            }
          );
        }
      }
    } catch (error) {
      console.error("Error in checkAndSendDailyEmails:", error);
    }
  }

  async listActiveEmails() {
    try {
      return await this.emailTasks.find().sort({ send_time: 1 }).toArray();
    } catch (error) {
      console.error("Failed to list active emails:", error);
      throw error;
    }
  }

  async updateEmail(taskId, updates) {
    try {
      await this.emailTasks.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: updates }
      );
      console.log(`Task ${taskId} updated successfully`);
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  }

  async pauseEmail(taskId) {
    await this.updateEmail(taskId, { active: false });
  }

  async resumeEmail(taskId) {
    await this.updateEmail(taskId, { active: true });
  }

  async deleteEmail(taskId) {
    try {
      const isdel = await this.emailTasks.deleteOne({
        _id: new ObjectId(taskId),
      });
      if (isdel.deletedCount > 0) {
        console.log(
          `Task ${taskId} deleted successfully. Delete result:`,
          isdel
        );
      } else {
        console.log(`Task ${taskId} was not found and could not be deleted.`);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  }

  start() {
    if (this.cronJob) {
      console.log("Scheduler is already running.");
      return;
    }

    this.cronJob = cron.schedule("* * * * *", () => {
      this.checkAndSendDailyEmails();
    });
    console.log("Daily email scheduler started.");
  }
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("Daily email scheduler stopped.");
    } else {
      console.log("Scheduler is not running.");
    }
  }

  isRunning() {
    return !!this.cronJob;
  }
  async close() {
    await this.client.close();
    console.log("MongoDB connection closed");
  }
}

// Example usage
async function main() {
  const scheduler = new EmailScheduler(
    process.env.MONGODB_URI,
    process.env.SENDGRID_API_KEY
  );

  // Wait for initialization
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Add a daily email task
  await scheduler.addDailyEmail(
    "user@example.com",
    "Here is your daily prompt: Write about your goals.",
    "09:00" // Will send every day at 9:00 AM
  );

  // Start the scheduler
  scheduler.start();
}

module.exports = EmailScheduler;

if (require.main === module) {
  main().catch(console.error);
}
