const express = require('express');
const EmailScheduler = require('./EmailScheduler');
const port = process.env.PORT || 5000;
const scheduler = new EmailScheduler();
const expressLayouts = require('express-ejs-layouts');
const {ObjectId } = require('mongodb');

const app = express();
let isSchedulerRunning = false; 
let tasks = []
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
// List all tasks
app.get('/', async (req, res) => {
    try {
        const tasks = await scheduler.listActiveEmails();
        res.render('index', { tasks,isRunning: isSchedulerRunning });
    } catch (error) {
        res.render('index', { tasks: [], error: error.message, isRunning: isSchedulerRunning});
    }
});


// Route to start the scheduler
app.post('/scheduler/start', (req, res) => {
    try {
        scheduler.start();
        isSchedulerRunning = true;
        res.redirect('/');
    } catch (error) {
        console.error('Error starting scheduler:', error);
        res.redirect('/');
    }
});

// Route to stop the scheduler
app.post('/scheduler/stop', (req, res) => {
    try {
        scheduler.stop(); // Stops the scheduler and closes MongoDB connection
        isSchedulerRunning = false;
        res.redirect('/');
    } catch (error) {
        console.error('Error stopping scheduler:', error);
        res.redirect('/');
    }
});

// Show new task form
app.get('/tasks/new', (req, res) => {
    res.render('new');
});

// Create new task
app.post('/tasks/create', async (req, res) => {
    try {
        const { email, prompt, send_time } = req.body;
        await scheduler.addDailyEmail(email, prompt, send_time);
        res.redirect('/');
    } catch (error) {
        res.render('new', { error: error.message });
    }
});

// Show edit form
app.get('/tasks/edit/:id', async (req, res) => {
    try {
        const task = await scheduler.emailTasks.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!task) {
            console.log(`error in edit: ${task} ${req.params.id}`)
            return res.redirect('/');
        }
        res.render('edit', { task });
    } catch (error) {
        console.log(error)
        res.redirect('/');
    }
});

// Update task
app.post('/tasks/update/:id', async (req, res) => {
    try {
        const { email, prompt, send_time } = req.body;
        await scheduler.updateEmail(req.params.id, { email, prompt, send_time });
        res.redirect('/');
    } catch (error) {
        res.render('edit', { 
            task: { ...req.body, _id: req.params.id }, 
            error: error.message 
        });
    }
});

// Pause task
app.post('/tasks/pause/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        await scheduler.pauseEmail(taskId);
        console.log(`Task ${taskId} paused successfully`);
        res.redirect('/');
    } catch (error) {
        console.error(`Failed to pause task ${req.params.id}:`, error);
        res.status(500).send(`Error pausing task: ${error.message}`);
    }
});

// Resume task
app.post('/tasks/resume/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        await scheduler.resumeEmail(taskId);
        console.log(`Task ${taskId} resumed successfully`);
        res.redirect('/');
    } catch (error) {
        console.error(`Failed to resume task ${req.params.id}:`, error);
        res.status(500).send(`Error resuming task: ${error.message}`);
    }
});

// Delete task
app.post('/tasks/delete/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const isDeleted = await scheduler.deleteEmail(taskId);
        if (isDeleted.deletedCount === 0) {
            console.warn(`Task ${taskId} not found or already deleted`);
            res.status(404).send(`Task ${taskId} not found or already deleted`);
        } else {
            console.log(`Task ${taskId} deleted successfully`);
            res.redirect('/');
        }
    } catch (error) {
        console.error(`Failed to delete task ${req.params.id}:`, error);
        res.status(500).send(`Error deleting task: ${error.message}`);
    }
});


app.listen(port, () =>
    console.log(`Server running on port http://localhost:${port} 🔥`)
  );

