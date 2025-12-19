'use strict';
const Thread = require('../models/thread');

module.exports = function (app) {

  // --- THREADS API ---
  app.route('/api/threads/:board')
  
    // POST Thread (Test 5)
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      const newThread = new Thread({
        board, text, delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });
      try {
        const saved = await newThread.save();
        res.json(saved);
      } catch(err) { res.status(500).send("Error saving thread"); }
    })

    // GET Threads (Test 7)
    .get(async (req, res) => {
      const board = req.params.board;
      try {
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 }) // Newest bumped first
          .limit(10)
          .lean();

        threads.forEach(t => {
          delete t.delete_password;
          delete t.reported;
          t.replies.sort((a,b) => b.created_on - a.created_on);
          t.replies = t.replies.slice(0, 3); // Top 3 replies only
          t.replies.forEach(r => {
             delete r.delete_password;
             delete r.reported;
          });
        });
        res.json(threads);
      } catch(err) { res.status(500).send("Error fetching threads"); }
    })

    // PUT Report Thread (Test 11)
    .put(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if(!thread) return res.send("Thread not found");
        thread.reported = true;
        await thread.save();
        res.send("reported");
      } catch(err) { res.send("error reporting"); }
    })

    // DELETE Thread (Test 9)
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if(!thread) return res.send("incorrect password"); // Obscure 404
        if(thread.delete_password === delete_password) {
          await Thread.findByIdAndDelete(thread_id);
          res.send("success");
        } else {
          res.send("incorrect password");
        }
      } catch(err) { res.send("incorrect password"); }
    });

  // --- REPLIES API ---
  app.route('/api/replies/:board')

    // POST Reply (Test 6)
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if(!thread) return res.send("Thread not found");
        
        const newReply = { text, delete_password, created_on: new Date(), reported: false };
        thread.replies.push(newReply);
        thread.bumped_on = newReply.created_on; // Update bump time
        await thread.save();
        res.json(thread); 
      } catch(err) { res.status(500).send("Error posting reply"); }
    })

    // GET Single Thread (Test 8)
    .get(async (req, res) => {
      try {
        const thread = await Thread.findById(req.query.thread_id).lean();
        if(!thread) return res.send("Thread not found");
        delete thread.delete_password;
        delete thread.reported;
        thread.replies.forEach(r => {
           delete r.delete_password;
           delete r.reported;
        });
        res.json(thread);
      } catch(err) { res.status(500).send("Error fetching thread"); }
    })

    // PUT Report Reply (Test 12)
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if(!thread) return res.send("Thread not found");
        const reply = thread.replies.id(reply_id);
        if(!reply) return res.send("Reply not found");
        reply.reported = true;
        await thread.save();
        res.send("reported");
      } catch(err) { res.send("error reporting"); }
    })

    // DELETE Reply (Test 10)
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if(!thread) return res.send("incorrect password");
        const reply = thread.replies.id(reply_id);
        if(!reply) return res.send("incorrect password");
        
        if(reply.delete_password === delete_password) {
          reply.text = "[deleted]"; // Do not delete object, just change text
          await thread.save();
          res.send("success");
        } else {
          res.send("incorrect password");
        }
      } catch(err) { res.send("incorrect password"); }
    });
};